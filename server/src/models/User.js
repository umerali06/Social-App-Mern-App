// server/src/models/User.js
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
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Hash password before saving (only for local users)
userSchema.pre("save", async function (next) {
  // Skip hashing if not a local-signup or password not provided/modified
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

// Instance method to compare passwords
userSchema.methods.isValidPassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
