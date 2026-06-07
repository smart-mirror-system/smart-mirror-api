const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');
const { GoogleGenAI } = require('@google/genai');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const { loadEnv } = require('./config/env');
const app = require('./app');
const { connectDB } = require('./db');
const userRepo = require('./repositories/user.repository');
const ChatMessage = require('./models/ChatMessage');
const Chat = require('./models/Chat');
const CHATBOT_SYSTEM_PROMPT = require('./constants/prompts');

loadEnv();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "https://admin.socket.io",
      "http://127.0.0.1:5500",
      "http://localhost:5500"
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
});

// Socket Auth (JWT)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized: missing token'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Device token
    if (decoded.type === 'device' && decoded.deviceId) {
      socket.device = { id: String(decoded.deviceId) };
      socket.authType = 'device';
      return next();
    }

    // User token
    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) return next(new Error('Unauthorized: bad token payload'));

    socket.user = { id: String(userId) };
    socket.authType = 'user';
    return next();
  } catch (e) {
    next(new Error('Unauthorized: invalid token'));
  }
});

const DEFAULT_DEVICE_ID =
  process.env.DEFAULT_DEVICE_ID || 'my-smart-mirror-001';
const deviceRoom = (deviceId) => `device:${deviceId}`;

// Events
const sessions = new Map(); // userId -> session aggregate

const rateLimiter = new RateLimiterMemory({
  points: 5, // Number of allowed requests
  duration: 60, // Per second(s)
});

function getOrCreateSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      startedAt: null,
      exerciseType: null,
      lastReps: 0,
      scores: [],
      mistakesCount: {},
      deviceId: DEFAULT_DEVICE_ID,
    });
  }
  return sessions.get(userId);
}

function buildSummary(userId) {
  const s = sessions.get(userId);
  if (!s || !s.startedAt) return null;

  const reps = Number(s.lastReps || 0);
  const avgScore =
    s.scores.length > 0
      ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
      : 0;

  let topMistake = null;
  let topMistakeCount = 0;
  for (const [k, v] of Object.entries(s.mistakesCount)) {
    if (v > topMistakeCount) {
      topMistake = k;
      topMistakeCount = v;
    }
  }

  const durationSec = Math.max(
    0,
    Math.round((Date.now() - s.startedAt) / 1000)
  );

  return {
    userId,
    exerciseType: s.exerciseType,
    reps,
    avgScore,
    topMistake,
    topMistakeCount,
    durationSec,
    endedAt: Date.now(),
  };
}

io.on('connection', (socket) => {
  // =========================
  // 1) USER connection
  // =========================
  if (socket.authType === 'user') {
    const userId = socket.user.id;

    // Auto-join user's room
    socket.join(userId);
    console.log('USER connected', { socketId: socket.id, userId });

    // Frontend -> Backend
    socket.on('workout:start', (payload = {}) => {
      const exerciseType = String(payload.exerciseType || '').trim();
      if (!exerciseType) return;

      const s = getOrCreateSession(userId);
      s.startedAt = Date.now();
      s.exerciseType = exerciseType;
      s.lastReps = 0;
      s.scores = [];
      s.mistakesCount = {};
      s.deviceId = DEFAULT_DEVICE_ID;

      // Inform frontend (optional)
      io.to(userId).emit('workout:start', { userId, exerciseType });

      // Send command to the mirror device
      io.to(deviceRoom(s.deviceId)).emit('workout:start', {
        userId,
        exerciseType,
      });

      console.log('workout:start', {
        userId,
        exerciseType,
        deviceId: s.deviceId,
      });
    });

    socket.on('workout:stop', () => {
      const s = sessions.get(userId);

      // Inform mirror device
      if (s?.deviceId) {
        io.to(deviceRoom(s.deviceId)).emit('workout:stop', { userId });
      }

      // Inform frontend
      io.to(userId).emit('workout:stop', { userId });

      // Summary
      const summary = buildSummary(userId);
      if (summary) {
        io.to(userId).emit('workout:summary', summary);
        console.log('workout:summary', summary);
      }

      sessions.delete(userId);
      console.log('workout:stop', { userId });
    });

    socket.on('disconnect', (reason) => {
      sessions.delete(userId);
      console.log('USER disconnected', { socketId: socket.id, userId, reason });
    });

    // ########################## Chatbot Event ###################################
    socket.on('chat:message', async (payload = {}) => {
      const GEMINI_MODEL = 'gemini-3-flash-preview';
      try {
        let fullResponse = '';
        const message = payload?.message
          ? String(payload.message).trim()
          : null;

        if (!message)
          return socket.emit('chat:error', {
            reason: "message can't be empty",
          });
        if (message.length > 2000)
          return socket.emit('chat:error', { reason: 'message is too long' });

        try {
          await rateLimiter.consume(userId, 1);
        } catch (rateLimitError) {
          // If the promise rejects, they are out of points
          const retrySecs = Math.round(rateLimitError.msBeforeNext / 1000) || 1;
          return socket.emit('chat:error', {
            reason: `Rate limit exceeded. Please wait ${retrySecs} seconds.`,
          });
        }

        const chatId = payload?.chatId;
        if (!chatId)
          return socket.emit('chat:error', {
            reason: 'chatId is missing',
          });

        const chatExists = await Chat.exists({ _id: chatId, userId: userId });
        if (!chatExists) {
          return socket.emit('chat:error', {
            reason: 'chat missing or unauthorized',
          });
        }

        const userMessageRecord = await ChatMessage.create({
          chatId,
          userId,
          message: message,
          role: 'User',
        });

        await Chat.updateOne(
          { _id: chatId },
          { $set: { updatedAt: Date.now() } }
        );

        const userdata = await userRepo.findById(
          userId,
          'profile trainingSchedule diet'
        );

        socket.emit('chat:typing', { isTyping: true });
        const responseStream = await client.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: [{ role: 'user', parts: [{ text: message }] }],
          config: {
            systemInstruction: {
              parts: [
                {
                  text:
                    CHATBOT_SYSTEM_PROMPT +
                    `\nUser data: ${JSON.stringify(userdata)}` +
                    `\nCurrent date and time: ${new Date().toLocaleString()}`,
                },
              ],
            },
          },
        });

        // sending data piece by piece, must be embedded in the frontend
        for await (const chunk of responseStream) {
          const chunkText = chunk.text;
          if (!chunkText) continue;
          fullResponse += chunkText;
          socket.emit('chat:chunk', { text: chunkText });
        }

        const botMessageRecord = await ChatMessage.create({
          chatId,
          userId,
          message: fullResponse,
          role: 'Bot',
        });

        await Chat.updateOne(
          { _id: chatId },
          { $set: { updatedAt: Date.now() } }
        );

        socket.emit('chat:reply:done', { fullText: fullResponse });
        socket.emit('chat:typing', { isTyping: false });
      } catch (error) {
        console.error('Gemini Error:', error);
        socket.emit('chat:error', {
          message: 'Internal server problem, try again later',
        });
        socket.emit('chat:typing', { isTyping: false });
      }
    });

    return;
  }

  // =========================
  // 2) DEVICE connection (Mirror)
  // =========================
  if (socket.authType === 'device') {
    const deviceId = socket.device.id;

    socket.join(deviceRoom(deviceId));
    console.log('DEVICE connected', { socketId: socket.id, deviceId });

    // 🚨 New Event: Handling the automatic Stop signal (✋ sign) from the mirror
    socket.on('workout:cancel', (payload = {}) => {
      const userId = payload?.userId ? String(payload.userId) : '';
      if (!userId) return;

      console.log('🚨 [AI Gesture] Workout Cancel triggered via X sign for user:', userId);

      // 1. Send a "Stop" command to the frontend to close the exercise page and display the Summary
      io.to(userId).emit('workout:stop', { userId });

      // 2. Compile the Summary and send it to the frontend immediately, as if the user clicked Stop themselves
      const summary = buildSummary(userId);
      if (summary) {
        io.to(userId).emit('workout:summary', summary);
        console.log('workout:summary sent via gesture', summary);
      }

      // 3. Clear the session from memory
      sessions.delete(userId);
    });
    
    // Mirror -> Backend: progress
    socket.on('ai:progress', (payload = {}) => {
      const userId = payload?.userId ? String(payload.userId) : '';
      if (!userId) return;

      // Update aggregate session (only if session is running)
      const s = sessions.get(userId);
      if (s && s.startedAt) {
        if (typeof payload.reps === 'number') s.lastReps = payload.reps;

        const sc = Number(payload.formScore);
        if (!Number.isNaN(sc) && sc >= 0 && sc <= 100) s.scores.push(sc);

        if (Array.isArray(payload.mistakes)) {
          for (const m of payload.mistakes) {
            const t = m?.type ? String(m.type) : null;
            if (!t) continue;
            const c = Number(m.count || 1);
            s.mistakesCount[t] =
              (s.mistakesCount[t] || 0) + (Number.isFinite(c) ? c : 1);
          }
        }
      }

      // Forward to user's room
      io.to(userId).emit('workout:progress', payload);
    });

    socket.on('disconnect', (reason) => {
      console.log('DEVICE disconnected', {
        socketId: socket.id,
        deviceId,
        reason,
      });
    });

    return;
  }

  // If neither
  console.log('Unknown socket type, disconnecting', { socketId: socket.id });
  socket.disconnect(true);
});

// Start after DB connects
connectDB()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`API+WS running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
