const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const { loadEnv } = require("./src/config/env");
const app = require("./src/app");
const { connectDB } = require("./src/db");

loadEnv();

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // IMPORTANT: frontend domain
    methods: ["GET", "POST"],
  },
});

// Socket Auth (JWT)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized: missing token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try common fields: id / _id / userId
    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) return next(new Error("Unauthorized: bad token payload"));

    socket.user = { id: String(userId) };
    next();
  } catch (e) {
    next(new Error("Unauthorized: invalid token"));
  }
});

// Events
io.on("connection", (socket) => {
  // Join room (each user has a room)
  socket.on("room:join", ({ userId }) => {
  console.log("room:join", { from: socket.user.id, userId });
    const myUserId = socket.user?.id;
    if (!myUserId) return;

    // Security: user can only join his own room
    if (String(userId) !== String(myUserId)) return;

    socket.join(myUserId);
  });

  // AI sends live progress
  socket.on("ai:progress", (payload) => {
  console.log("ai:progress", payload);
    const myUserId = socket.user?.id;
    if (!myUserId) return;

    // Security: accept only if payload.userId matches token user
    if (String(payload?.userId) !== String(myUserId)) return;

    // Broadcast to dashboard
    io.to(myUserId).emit("workout:progress", payload);
  });
});

// Start after DB connects
connectDB()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`API+WS running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
