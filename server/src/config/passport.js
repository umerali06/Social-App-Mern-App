const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");

// ─── Unified User Finder ────────────────────────────────────────────────────────
async function findOrCreate(profile, provider) {
  const email = profile.emails?.[0]?.value;

  // Step 1: Check if user already linked with this provider
  let user = await User.findOne({ provider, providerId: profile.id });
  if (user) return user;

  // Step 2: Link provider to existing email
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user.provider = provider;
      user.providerId = profile.id;
      await user.save();
      return user;
    }
  }

  // Step 3: Create new user
  return User.create({
    name: profile.displayName || profile.username || "Unnamed User",
    email,
    provider,
    providerId: profile.id,
    password: null, // no password for OAuth
  });
}

// ─── Google Strategy ───────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreate(profile, "google");
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ─── GitHub Strategy ───────────────────────────────────────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreate(profile, "github");
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
