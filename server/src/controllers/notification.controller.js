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

    // Populate the notification with sender and post data
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name profilePicture")
      .populate("post", "_id content");

    const io = req.app.get("io");
    io.to(recipient.toString()).emit("newNotification", {
      _id: populatedNotification._id,
      type,
      sender: populatedNotification.sender,
      post: populatedNotification.post,
      createdAt: populatedNotification.createdAt,
    });

    res.status(201).json(populatedNotification);
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
      .populate("post", "_id content")
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
