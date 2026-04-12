const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const { loadEnv } = require('./src/config/env');
const app = require('./src/app');
const { connectDB } = require('./src/db');

loadEnv();

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
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

    return;
  }

  // =========================
  // 2) DEVICE connection (Mirror)
  // =========================
  if (socket.authType === 'device') {
    const deviceId = socket.device.id;

    socket.join(deviceRoom(deviceId));
    console.log('DEVICE connected', { socketId: socket.id, deviceId });

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
