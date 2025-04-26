const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  createPost,
  getFeed,
  likePost,
} = require("../controllers/post.controller");

const router = express.Router();

router.use(auth); // Ensure authentication for all post routes
router.post("/", createPost); // Create a post
router.get("/", getFeed); // Get the feed
router.post("/:postId/like", likePost); // Like/unlike a post

module.exports = router;
