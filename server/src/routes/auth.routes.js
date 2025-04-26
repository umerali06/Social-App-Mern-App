const express = require("express");
const passport = require("passport");
const {
  authenticateWithGoogle,
  createToken,
} = require("../services/auth.service"); // Correct import
const validate = require("../middleware/validate.middleware");
const { signupSchema, loginSchema } = require("../validations/auth.validation");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const router = express.Router();

// Local signup/login routes
router.post("/signup", validate(signupSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Google OAuth route
router.post("/google-login", async (req, res) => {
  try {
    const { id_token } = req.body; // Accept ID Token instead of access_token
    const user = await authenticateWithGoogle(id_token); // Authenticate with Google using the ID Token
    const token = createToken(user); // Generate JWT for authenticated user

    // Log token creation for debugging
    console.log("Google login successful, token created:", token);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set 'secure' in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });
    res.status(200).json({ message: "Successfully logged in with Google" });
  } catch (error) {
    console.error("Error during Google login:", error); // More specific error logging
    res
      .status(500)
      .json({ message: "Failed to log in with Google", error: error.message });
  }
});

// For Google OAuth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/failure",
  }),
  (req, res) => {
    const token = createToken(req.user);

    // Log token creation for debugging
    console.log("Google callback successful, token created:", token);

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use 'secure' in production
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      })
      .redirect(`${process.env.CLIENT_URL}/oauth-success`); // Redirect to client without exposing the token in URL
  }
);

router.post("/github-login", async (req, res) => {
  const { code } = req.body; // The GitHub code from the frontend
  try {
    // Use GitHub's code to get user data
    const user = await authenticateWithGithub(code); // Use a function to authenticate the user with GitHub
    const token = createToken(user); // Create JWT for authenticated user
    res.cookie("accessToken", token, {
      httpOnly: true, // Store JWT in HTTP-only cookie
      secure: process.env.NODE_ENV === "production", // Use secure cookie in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });
    res.status(200).json({ message: "Successfully logged in with GitHub" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to log in with GitHub" });
  }
});

// GitHub OAuth callback route
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/auth/failure",
  }),
  (req, res) => {
    const token = createToken(req.user); // Generate JWT for authenticated user

    // Log to verify if we're here and if token is generated
    console.log("GitHub callback successful, token created:", token);

    res.cookie("accessToken", token, {
      httpOnly: true, // Secure cookie
      secure: process.env.NODE_ENV === "production", // Set 'secure' in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    // Log the CLIENT_URL to ensure it's correct
    console.log("Redirecting to:", process.env.CLIENT_URL);

    res.redirect(`${process.env.CLIENT_URL}/home`); // Redirect to the client (home page)
  }
);

// Optional failure route
router.get("/failure", (req, res) =>
  res.status(401).json({ message: "OAuth Failed" })
);

module.exports = router;
