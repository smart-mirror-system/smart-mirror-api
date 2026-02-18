// src/socket.js
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

function initSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow connections from any origin (Adjust for production)
            methods: ["GET", "POST"]
        }
    });

    // Middleware: Verify JWT before allowing connection
    // As requested in AI part1.pdf: "verify JWT in handshake" [cite: 1725]
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error: Token required"));
        }

        try {
            // Verify using the same secret as your auth middleware
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = payload; // Attach user info to socket
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id} (User: ${socket.user.userId})`);

        // Event 1: room:join
        // The AI Service or Frontend sends this to join a specific user's room [cite: 1717, 1785]
        socket.on("room:join", () => {
            // usage of the secure ID from the token we verified in middleware
            const secureId = socket.user.userId;

            socket.join(secureId);
            console.log(`Socket ${socket.id} joined secure room: ${secureId}`);
        });

        // Event 2: ai:progress
        // The AI Service sends this every time reps increase [cite: 1718, 1787]
        socket.on("ai:progress", (payload) => {
            // Payload structure: { userId, exerciseType, reps, formScore, mistakes, ts }
            console.log("Received progress:", payload);

            const { userId } = payload;

            // Broadcast to the Frontend listening in the same 'userId' room
            // PDF Requirement: Backend broadcasts 'workout:progress' [cite: 1720, 1797]
            if (userId) {
                io.to(userId).emit("workout:progress", payload);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });

    return io;
}

module.exports = { initSocket };