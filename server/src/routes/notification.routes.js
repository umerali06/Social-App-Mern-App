const express = require("express");
const router = express.Router();
const {
  createNotification,
  getNotifications,
  markAsRead,
} = require("../controllers/notification.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, createNotification);
router.get("/", auth, getNotifications);
router.patch("/:id/read", auth, markAsRead);

module.exports = router;
