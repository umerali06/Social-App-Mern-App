// server/src/routes/user.routes.js
const express = require("express");
const auth = require("../middleware/auth.middleware");
const { getProfile } = require("../controllers/user.controller");

const router = express.Router();

// GET /api/users/profile
router.get("/profile", auth, getProfile);

module.exports = router;
