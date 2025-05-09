// ✅ STEP 1: Updated User Schema (server/src/models/User.js)

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  provider: {
    type: String,
    enum: ["local", "google", "github"],
    default: "local",
  },
  providerId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    maxlength: 300,
    trim: true,
    default: "",
  },
  location: {
    type: String,
    maxlength: 100,
    trim: true,
    default: "",
  },
  bannerImage: {
    type: String,
    default: "",
  },
  isOnline: {
    type: Boolean,
    default: false,
  },

  website: {
    type: String,
    trim: true,
    default: "",
    validate: {
      validator: function (v) {
        return !v || /^https?:\/\/[\w.-]+\.[a-z]{2,}.*$/.test(v);
      },
      message: "Please enter a valid URL.",
    },
  },
  socialLinks: {
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
  },
  language: {
    type: String,
    enum: ["en", "es", "fr", "de"],
    default: "en",
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
});

userSchema.pre("save", async function (next) {
  if (
    this.provider !== "local" ||
    !this.isModified("password") ||
    !this.password
  ) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.isValidPassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
