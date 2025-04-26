// server/src/server.js
require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

// Connect to database, then start server
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
});

app.use((req, res, next) => {
  // Allow cross-origin requests from your frontend domain
  res.setHeader("Access-Control-Allow-Origin", "https://yourfrontendapp.com"); // Replace with your frontend URL
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Set Cross-Origin policies to be compatible with Google Auth
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

const corsOptions = {
  origin: process.env.CLIENT_URL, // e.g., 'http://localhost:3000' for development
  credentials: true, // Allow cookies to be sent
  allowedHeaders: ["Content-Type", "Authorization"], // Add headers as needed
};

app.use(cors(corsOptions));
