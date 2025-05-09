const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  getProfile,
  updateProfile,
  updateLanguage,
  updateNotificationPrefs,
} = require("../controllers/user.controller");
const upload = require("../middleware/cloudinaryUpload"); // your multer config
const { getAllUsers } = require("../controllers/user.controller");

const router = express.Router();

// ✅ Get All Users
router.get("/", auth, getAllUsers);

// GET /api/users/profile
router.get("/profile", auth, getProfile);

const { getChatUsers } = require("../controllers/user.controller");

// ✅ Get chat users excluding self
router.get("/chats", auth, getChatUsers);

// ✅ PATCH with support for both profilePicture and bannerImage uploads
router.patch(
  "/profile",
  auth,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  updateProfile
);

const { changePassword } = require("../controllers/user.controller");

// Add this route
router.post("/change-password", auth, changePassword);

router.patch("/language", auth, updateLanguage);

router.patch("/notifications", auth, updateNotificationPrefs);

const { deleteAccount } = require("../controllers/user.controller");

// Add this route
router.delete("/delete-account", auth, deleteAccount);

router.post("/user/logout", auth, (req, res) => {
  // destroy session or token, etc.
  res.json({ message: "Logged out" });
});

module.exports = router;
