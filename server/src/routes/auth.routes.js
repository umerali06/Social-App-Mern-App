const express = require("express");
const passport = require("passport");
const validate = require("../middleware/validate.middleware");
const { signupSchema, loginSchema } = require("../validations/auth.validation");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { createToken } = require("../services/auth.service");

const router = express.Router();

// ─── Local Signup/Login ────────────────────────────────────────────────────────
router.post("/signup", validate(signupSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ─── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/failure",
  }),
  (req, res) => {
    const token = createToken(req.user);

    // ✅ Set the token in a secure HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // false for localhost
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    // ✅ Redirect to frontend home
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);

// ─── GitHub OAuth ──────────────────────────────────────────────────────────────
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/api/auth/failure",
  }),
  (req, res) => {
    const token = createToken(req.user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);

// ─── Failure Handler ───────────────────────────────────────────────────────────
router.get("/failure", (req, res) =>
  res.status(401).json({ message: "OAuth Failed" })
);

module.exports = router;
