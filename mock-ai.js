const { io } = require("socket.io-client");

const API_URL = "http://localhost:3000";
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OThhMThlZGU2M2NhNGE3ZWM0YjcxYzkiLCJpYXQiOjE3NzEzMzY5MjIsImV4cCI6MTc3MTk0MTcyMn0.TK5cU2UHr8DWbUmjfi74t_Tb0YbmLhjXSkq_pqxmSjA";        // نفس التوكن اللي طلع من login
const USER_ID = "698a18ede63ca4a7ec4b71c9";

const socket = io(API_URL, { auth: { token: JWT }, transports: ["websocket"] });

socket.on("connect", () => {
  console.log("mock-ai connected");
  socket.emit("room:join", { userId: USER_ID });

  let reps = 0;
  setInterval(() => {
    reps++;
    socket.emit("ai:progress", {
      userId: USER_ID,
      exerciseType: "squat",
      reps,
      formScore: 80 + (reps % 10),
      mistakes: reps % 3 === 0 ? [{ type: "knees_in", count: 1 }] : [],
      ts: Date.now(),
    });
  }, 1000);
});

socket.on("connect_error", (e) => console.log("connect_error", e.message));
