// server/src/services/auth.service.js
const axios = require("axios");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function authenticateWithOAuth(profile, provider) {
  // Check if the user already exists by email
  let user = await User.findOne({ email: profile.email });

  if (!user) {
    // If user doesn't exist, create a new one
    user = new User({
      email: profile.email,
      name: profile.name,
      provider: provider, // "google" or "github"
      providerId: profile.id, // generic provider ID field
    });

    // Add provider-specific fields
    if (provider === "google") {
      user.googleId = profile.sub; // Google-specific ID
    } else if (provider === "github") {
      user.githubId = profile.id; // GitHub-specific ID
    }

    await user.save(); // Save the new user
  }

  return user;
}

// Google Authentication
async function authenticateWithGoogle(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Ensure this matches your Google Client ID
    });
    const payload = ticket.getPayload();
    return await authenticateWithOAuth(payload, "google");
  } catch (error) {
    console.error("Google authentication failed: ", error);
    throw new Error("Google authentication failed.");
  }
}

// GitHub Authentication
async function authenticateWithGithub(code) {
  try {
    // Exchange the GitHub OAuth code for an access token
    const { data } = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code, // Code received from GitHub callback
      },
      {
        headers: {
          Accept: "application/json", // Accept JSON response
        },
      }
    );

    if (!data.access_token) {
      throw new Error("No access token received from GitHub");
    }

    // Use the access token to get the user's GitHub profile
    const userProfile = await axios.get(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`, // Bearer token
      },
    });

    return await authenticateWithOAuth(userProfile.data, "github");
  } catch (error) {
    console.error("GitHub authentication failed:", error);
    throw new Error("GitHub authentication failed.");
  }
}

// JWT Token Creation
const createToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Consider using a shorter expiration for better security
  });
};

// Register User (with password hashing)
const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email already in use");

  // const hashedPassword = await bcrypt.hash(password, 12); // Hash the password before saving
  const user = await User.create({ name, email, password });
  await user.save(); // This will trigger the `pre("save")` hook safely

  return { user, token: createToken(user) };
};

// Login User (verify password)
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const valid = await user.isValidPassword(password.toString());
  if (!valid) throw new ApiError(401, "Invalid credentials");

  return { user, token: createToken(user) };
};

module.exports = {
  authenticateWithGoogle,
  authenticateWithGithub,
  createToken,
  loginUser,
  registerUser,
};
