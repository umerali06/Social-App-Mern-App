// server/src/controllers/auth.controller.js
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/email");
const catchAsync = require("../utils/catchAsync");
const { registerUser, loginUser } = require("../services/auth.service");

// Cookie options: 7 days, HTTP-only, secure in production, SameSite lax
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * POST /api/auth/signup
 */
const register = catchAsync(async (req, res) => {
  const { user, token } = await registerUser(req.body);

  res
    .cookie("accessToken", token, cookieOptions)
    .status(201) // ← hard-code CREATED
    .json({ user });
});

/**
 * POST /api/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { user, token } = await loginUser(req.body);

  res
    .cookie("accessToken", token, cookieOptions)
    .status(200) // ← hard-code OK
    .json({ user });
});

/**
 * GET /api/auth/logout
 */
const logout = catchAsync(async (_req, res) => {
  res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .status(200) // ← hard-code OK
    .json({ message: "Successfully logged out" });
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond 200 to prevent email enumeration
  if (!user) {
    return res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
  }

  // 1. Generate reset token & expiry
  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // 2. Build reset URL
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  // 3. Send email
  const message = `
You requested a password reset.
Please click the link below to set a new password (valid for 1 hour):

${resetURL}

If you did not request this, please ignore this email.
  `;
  await sendEmail({
    to: user.email,
    subject: "Password Reset Request",
    text: message,
  });

  res
    .status(200)
    .json({ message: "If that email exists, a reset link has been sent." });
});

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  // 1. Hash the incoming token
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  // 2. Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res
      .status(400)
      .json({ message: "Token is invalid or has expired." });
  }

  // 3. Update password & clear reset fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password has been reset." });
});

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
