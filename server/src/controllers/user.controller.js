// server/src/controllers/user.controller.js

// A simple profile endpoint
exports.getProfile = (req, res) => {
  // req.user was attached in auth.middleware.js
  res.json({ user: req.user });
};
