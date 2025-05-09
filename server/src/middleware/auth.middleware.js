const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    // 1. Check Authorization header or cookie
    let token;

    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token; // ✅ support for cookie-based auth
    }

    if (!token) {
      throw new ApiError(401, "Authentication token missing");
    }

    // 2. Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch and attach user
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

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select("-password");
    if (!user) return res.status(401).json({ message: "Invalid token" });

    req.user = user;
    next();
  } catch (err) {
    res
      .status(401)
      .json({ message: "Token verification failed", error: err.message });
  }
};

module.exports = authMiddleware;
