// server/src/routes/message.routes.js
const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  getMessagesWithUser,
  saveMessage,
} = require("../controllers/message.controller");

const router = express.Router();

// GET /api/messages/:userId
router.get("/:userId", auth, getMessagesWithUser);

// POST /api/messages
router.post("/", auth, saveMessage);

const { markMessagesAsRead } = require("../controllers/message.controller");

// PATCH /api/messages/read/:userId
router.patch("/read/:userId", auth, markMessagesAsRead);

const { getUnreadCounts } = require("../controllers/message.controller");

router.get("/unread-count", auth, getUnreadCounts);

// server/src/routes/message.routes.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");
const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "chat_images", // Specify the Cloudinary folder
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"], // File formats allowed
    },
  }),
});

// Image upload endpoint
router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  // Send back the Cloudinary URL of the uploaded image
  return res.json({ imageUrl: req.file.path });
});

module.exports = router;
