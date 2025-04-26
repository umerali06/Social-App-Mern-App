// server/src/services/auth.service.js
const axios = require("axios");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { Strategy: GitHubStrategy } = require("passport-github2");

async function authenticateWithGoogle(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Ensure this matches your Google Client ID
    });
    const payload = ticket.getPayload();
    // Check if the user already exists by email
    let user = await User.findOne({ email: payload.email });
    if (user) {
      return user;
    }
    if (!user) {
      user = new User({
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
      });
      await user.save();
    }
    return user;
  } catch (error) {
    console.error("Google authentication failed: ", error);
    throw new Error("Google authentication failed.");
  }
}

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

    // If there's no access token in the response, throw an error
    if (!data.access_token) {
      throw new Error("No access token received from GitHub");
    }

    // Use the access token to get the user's GitHub profile
    const userProfile = await axios.get(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`, // Bearer token
      },
    });

    // Check if the user already exists by email (or GitHub ID)
    let user = await User.findOne({ email: userProfile.data.email });

    if (!user) {
      // If the user does not exist, create a new user
      user = new User({
        githubId: userProfile.data.id,
        name: userProfile.data.name,
        email: userProfile.data.email,
        provider: "github", // Set provider to GitHub
      });
      await user.save(); // Save the new user
    }

    // Return the user (existing or newly created)
    return user;
  } catch (error) {
    console.error("GitHub authentication failed:", error);
    throw new Error("GitHub authentication failed.");
  }
}
const createToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email already in use");
  const user = await User.create({ name, email, password });
  return { user, token: createToken(user) };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");
  const valid = await user.isValidPassword(password);
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
