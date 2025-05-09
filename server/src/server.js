// server/src/server.js
require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const Notification = require("./models/Notification");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

const onlineUsers = {};

io.on("connection", (socket) => {
  logger.info(`✅ WebSocket connected: ${socket.id}`);

  // ✅ Join user to their room
  socket.on("join", ({ userId, name }) => {
    const isAlreadyOnline = Object.values(onlineUsers).some(
      (u) => u._id === userId
    );

    if (isAlreadyOnline) {
      // Remove user from onlineUsers first if they are already listed
      delete onlineUsers[socket.id];
    }

    onlineUsers[socket.id] = { _id: userId, name };
    socket.join(userId.toString());

    if (!isAlreadyOnline) {
      socket.broadcast.emit("userJoined", { _id: userId, name });
    }

    io.emit("onlineUsers", {
      users: Object.values(onlineUsers),
    });

    logger.info(`🟢 ${name} joined (${userId})`);
  });

  // ✅ Direct Message Handler with DEDUPLICATION
  socket.on("sendMessage", async (msg) => {
    logger.info("📨 Incoming message from client:", msg);

    try {
      // 🔒 Prevent duplicate message insertions (same content + sender + receiver in last 5s)
      const existing = await Message.findOne({
        sender: msg.sender,
        receiver: msg.receiver,
        content: msg.content,
        createdAt: { $gt: new Date(Date.now() - 5000) }, // Last 5 seconds
      });

      const saved = existing
        ? existing
        : await Message.create({
            sender: msg.sender,
            receiver: msg.receiver,
            content: msg.content,
            read: msg.read ?? false,
            isImage: msg.isImage || false,
          });

      const { sender, receiver } = saved;

      // ✅ Emit message to receiver and sender rooms
      io.to(receiver.toString()).emit("receiveMessage", saved);
      io.to(sender.toString()).emit("receiveMessage", saved);

      // ✅ Update both chat sidebars
      io.to(receiver.toString()).emit("chatUpdate", {
        from: sender,
        preview: saved.content,
        timestamp: saved.updatedAt,
      });

      io.to(sender.toString()).emit("chatUpdate", {
        from: receiver,
        preview: saved.content,
        timestamp: saved.updatedAt,
      });

      // ✅ Create and emit notification if it wasn't a duplicate
      if (!existing) {
        const notification = await Notification.create({
          recipient: receiver,
          sender: sender,
          type: "message",
        });

        io.to(receiver.toString()).emit("newNotification", {
          _id: notification._id,
          type: "message",
          sender: {
            _id: sender,
            name: msg.senderName || "Unknown",
          },
          createdAt: notification.createdAt,
        });

        logger.info("✅ Message + Notification sent");
      } else {
        logger.info("⚠️ Duplicate message skipped (not inserted again)");
      }
    } catch (err) {
      logger.error("❌ Failed to process/send message:", err);
    }
  });

  // ✅ Typing indicators
  socket.on("userTyping", ({ to }) => {
    socket.to(to).emit("userTyping", { from: socket.id });
  });

  socket.on("userStopTyping", ({ to }) => {
    socket.to(to).emit("userStopTyping", { from: socket.id });
  });

  // ✅ New post notifications
  socket.on("newPost", (postData) => {
    socket.broadcast.emit("notifyPost", postData);
  });

  // ✅ Disconnect handler
  socket.on("disconnect", () => {
    const disconnected = onlineUsers[socket.id];
    if (disconnected) {
      logger.info(`❌ Disconnected: ${disconnected.name}`);
      delete onlineUsers[socket.id];

      socket.broadcast.emit("userLeft", {
        _id: disconnected._id,
        name: disconnected.name,
      });

      io.emit("onlineUsers", {
        users: Object.values(onlineUsers),
      });
    }
  });
});

// Attach io instance to app
app.set("io", io);

// Connect DB and start server
connectDB(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`🚀 Server & WebSocket running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
