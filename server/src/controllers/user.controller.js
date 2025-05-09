const User = require("../models/User");

exports.getProfile = (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};

    // ✅ Handle uploaded files if present
    if (req.files?.profilePicture) {
      updates.profilePicture = req.files.profilePicture[0].path;
    }
    if (req.files?.bannerImage) {
      updates.bannerImage = req.files.bannerImage[0].path;
    }

    // ✅ Handle regular text fields
    const fields = [
      "name",
      "username",
      "bio",
      "location",
      "website",
      "socialLinks",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        try {
          // try parsing JSON for complex fields like socialLinks
          updates[field] =
            typeof req.body[field] === "string" &&
            req.body[field].startsWith("{")
              ? JSON.parse(req.body[field])
              : req.body[field];
        } catch (e) {
          updates[field] = req.body[field];
        }
      }
    });

    // ✅ Perform update
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("Profile update error:", err);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id name email"); // only return public info
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getChatUsers = async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user._id } }, // exclude self
      "_id name isOnline"
    );
    res.json(users);
  } catch (err) {
    console.error("Error fetching chat users:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    // Verify current password
    if (
      user.provider === "local" &&
      !(await user.isValidPassword(currentPassword))
    ) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res
      .status(500)
      .json({ message: "Failed to change password", error: err.message });
  }
};

exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { language },
      { new: true }
    ).select("-password");

    res.json({ message: "Language updated", user: updatedUser });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update language", error: err.message });
  }
};

exports.updateNotificationPrefs = async (req, res) => {
  try {
    const { preferences } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: preferences },
      { new: true }
    ).select("-password");

    res.json({
      message: "Notification preferences updated",
      user: updatedUser,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update preferences", error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Account deletion error:", err);
    res
      .status(500)
      .json({ message: "Failed to delete account", error: err.message });
  }
};
