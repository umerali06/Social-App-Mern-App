// server/src/app.js
require("dotenv").config(); // load .env first
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(express.json()); // ✅ OK
app.use(express.urlencoded({ extended: true })); // ✅ OK for form fields

// Security headers
app.use(helmet());

// CORS: allow only your client + cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL, // e.g. "http://localhost:3000"
    credentials: true,
  })
);

// Parse cookies before routes
app.use(cookieParser());

// Body parser
app.use(express.json());

// Logger
app.use(morgan("dev"));

// Initialize Passport
app.use(passport.initialize());

// Mount routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const postRoutes = require("./routes/post.routes");
app.use("/api/posts", postRoutes);

app.use("/api/messages", require("./routes/message.routes"));

// Health-check
app.get("/api/health", (req, res) => res.json({ status: "OK" }));

// Global error handler (last!)
app.use(errorHandler);

module.exports = app;
