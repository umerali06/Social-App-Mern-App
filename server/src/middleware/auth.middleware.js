// server/src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    // 1. Grab token from cookie first, then Authorization header
    const token =
      // cookie-parser must be mounted upstream in app.js
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      throw new ApiError(401, "Authentication token missing");
    }

    // 2. Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user to request
    const user = await User.findById(payload.sub).select("-password");
    if (!user) throw new ApiError(401, "User not found");
    req.user = user;

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Invalid or expired token"));
    }
    next(err);
  }
};
