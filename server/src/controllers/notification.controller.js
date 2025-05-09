const Notification = require("../models/Notification");

// 🔔 Create a new notification
const createNotification = async (req, res) => {
  try {
    const { recipient, type, post } = req.body;

    const notification = await Notification.create({
      recipient,
      type,
      sender: req.user._id,
      post,
    });

    const io = req.app.get("io");
    io.to(recipient.toString()).emit("newNotification", {
      _id: notification._id,
      type,
      sender: { _id: req.user._id, name: req.user.name },
      post,
      createdAt: notification.createdAt,
    });

    res.status(201).json(notification);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create notification", error: err.message });
  }
};

// 📥 Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name profilePicture")
      .populate("post", "content")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: err.message });
  }
};

// ✅ Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this notification" });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: "Marked as read" });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to mark notification as read",
        error: err.message,
      });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
};
