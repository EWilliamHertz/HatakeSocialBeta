// Custom Next.js server with Socket.io for Euryx matchmaking & gameplay.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ---- Matchmaking state ----
const queue = []; // [{ socketId, userId, username }]
const rooms = new Map(); // roomId -> { players: [{socketId,userId,username}], moves: [] }

function pairPlayers(io) {
  while (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    const roomId = randomUUID();
    rooms.set(roomId, { players: [p1, p2], moves: [], createdAt: Date.now() });
    [p1, p2].forEach((p, idx) => {
      const opp = idx === 0 ? p2 : p1;
      io.to(p.socketId).emit("match-found", {
        roomId,
        you: { userId: p.userId, username: p.username },
        opponent: { userId: opp.userId, username: opp.username },
        seat: idx === 0 ? "player1" : "player2",
      });
    });
    console.log(`[matchmaking] Paired ${p1.username} vs ${p2.username} -> room ${roomId}`);
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/pokemon/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected ${socket.id}`);

    socket.on("queue:join", ({ userId, username }) => {
      // Prevent duplicates
      const existingIdx = queue.findIndex((q) => q.userId === userId);
      if (existingIdx >= 0) queue.splice(existingIdx, 1);
      queue.push({ socketId: socket.id, userId, username: username || "Trainer" });
      socket.emit("queue:joined", { position: queue.length });
      io.emit("queue:size", { size: queue.length });
      pairPlayers(io);
    });

    socket.on("queue:leave", () => {
      const idx = queue.findIndex((q) => q.socketId === socket.id);
      if (idx >= 0) queue.splice(idx, 1);
      socket.emit("queue:left", {});
      io.emit("queue:size", { size: queue.length });
    });

    socket.on("room:join", ({ roomId, userId, username, spectate }) => {
      socket.join(roomId);
      const room = rooms.get(roomId);
      if (!spectate) {
        socket.to(roomId).emit("opponent:joined", { userId, username });
      }
      socket.emit("room:joined", { roomId, state: room || null, spectator: !!spectate });
    });

    socket.on("game:move", ({ roomId, move }) => {
      const room = rooms.get(roomId);
      if (room) room.moves.push({ ...move, at: Date.now() });
      socket.to(roomId).emit("game:move", { move });
    });

    socket.on("game:chat", ({ roomId, text, username }) => {
      io.to(roomId).emit("game:chat", { text, username, at: Date.now() });
    });

    socket.on("disconnect", () => {
      const idx = queue.findIndex((q) => q.socketId === socket.id);
      if (idx >= 0) queue.splice(idx, 1);
      io.emit("queue:size", { size: queue.length });
      console.log(`[socket] disconnected ${socket.id}`);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`[euryx] Ready on http://${hostname}:${port} (dev=${dev})`);
    });
});
