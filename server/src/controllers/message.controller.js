// server/src/controllers/message.controller.js
const Message = require("../models/Message");
const Notification = require("../models/Notification");

// ✅ Get all messages between logged-in user and another user
exports.getMessagesWithUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Save new message and emit relevant updates
// ✅ Save new message and emit relevant updates
// ✅ Save new message and emit relevant updates
exports.saveMessage = async (req, res) => {
  try {
    const { receiver, content, isImage, imageUrl } = req.body;
    const sender = req.user._id;

    // Log the incoming message data
    console.log("Received message:", {
      sender,
      receiver,
      content,
      isImage,
      imageUrl,
    });

    // Validate required fields
    if (!sender || !receiver || !content) {
      return res
        .status(400)
        .json({ message: "Sender, receiver, and content are required" });
    }

    // If it's an image message, we'll save the image URL from Cloudinary
    if (isImage && !imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    let message;

    if (isImage) {
      message = await Message.create({
        sender,
        receiver,
        content: imageUrl, // Store image URL instead of text content
        isImage: true,
      });
    } else {
      message = await Message.create({ sender, receiver, content });
    }

    message = await message.populate("sender", "name");

    const io = req.app.get("io");

    // ✅ Send real-time message to BOTH sender and receiver
    io.to(receiver.toString()).emit("receiveMessage", message);
    io.to(sender.toString()).emit("receiveMessage", message);

    // ✅ Update chat preview for both users
    const chatPreviewPayload = {
      from: sender,
      preview: message.content,
      timestamp: message.updatedAt,
    };
    io.to(receiver.toString()).emit("chatUpdate", chatPreviewPayload);
    io.to(sender.toString()).emit("chatUpdate", {
      ...chatPreviewPayload,
      from: receiver,
    });

    // ✅ Send notification to receiver only
    if (receiver.toString() !== sender.toString()) {
      const notification = await Notification.create({
        recipient: receiver,
        sender,
        type: "message",
      });

      io.to(receiver.toString()).emit("newNotification", {
        _id: notification._id,
        type: "message",
        sender: {
          _id: sender,
          name: message.sender.name,
        },
        createdAt: notification.createdAt,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Mark all messages from a user as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const updated = await Message.updateMany(
      { sender: otherUserId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ updated: updated.modifiedCount });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get unread message counts grouped by sender
exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;

    const unread = await Message.aggregate([
      {
        $match: {
          receiver: userId,
          read: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    unread.forEach((u) => {
      result[u._id.toString()] = u.count;
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Unread count error:", err);
    res.status(500).json({ message: "Failed to get unread counts" });
  }
};
