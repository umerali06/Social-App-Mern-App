const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");
const {
  createToken,
  authenticateWithGithub,
} = require("../services/auth.service"); // reuse our JWT helper

// Helper to find-or-create a user
async function findOrCreate(profile, provider) {
  const email = profile.emails && profile.emails[0] && profile.emails[0].value;
  let user = await User.findOne({ provider, providerId: profile.id });
  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email,
      provider,
      providerId: profile.id,
      password: null, // no local password
    });
  }
  return user;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreate(profile, "google");
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// ─── Updated GitHub Strategy ───────────────────────────────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID, // Your GitHub OAuth Client ID
      clientSecret: process.env.GITHUB_CLIENT_SECRET, // Your GitHub OAuth Client Secret
      callbackURL: "http://localhost:5000/api/auth/github/callback", // Ensure this matches your redirect URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await authenticateWithGithub(accessToken, profile); // Authenticate using the profile data
        done(null, user); // Successfully authenticated, proceed
      } catch (error) {
        done(error, null); // Pass error to next handler
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id); // Serialize the user ID to store in session
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user); // Deserialize user from the database using the ID
  });
});
module.exports = passport;

module.exports.createToken = createToken;
