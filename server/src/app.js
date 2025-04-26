// server/src/app.js
const passport = require("./config/passport");
const cookieParser = require("cookie-parser");
require("express-async-errors"); // auto-catch async errors
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(passport.initialize());
// Global middleware
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// TODO: mount your routes, e.g.:
// const authRoutes = require('./routes/auth.routes');
// app.use('/api/auth', authRoutes);

// ... other imports
const authRoutes = require("./routes/auth.routes");

app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const postRoutes = require("./routes/post.routes");
app.use("/api/posts", postRoutes);

// Exampple Testing
// health-check
app.get("/api/health", (req, res) => res.json({ status: "OK" }));

app.get("/api/health", (req, res) => res.json({ status: "OK" }));

// Error handler (last)
app.use(errorHandler);

module.exports = app;
