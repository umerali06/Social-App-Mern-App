const express = require("express");
const { check } = require("express-validator");

const {
  createPost,
  getAllPosts,
  getPostById,
  toggleLike,
  resharePost,
  addComment,
  editComment,
  deleteComment,
  editPost,
  deletePost,
  toggleSavePost,
  getSavedPosts,
  getPostsByUser,
} = require("../controllers/post.controller");

const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/cloudinaryUpload");

const router = express.Router();

// ── /api/posts ────────────────────────────────────────────────────────────
router
  // Create a post (with optional media)
  .route("/")
  .post(authMiddleware, upload.single("media"), createPost)
  // Get all posts
  .get(getAllPosts);

// ── /api/posts/:postId ─────────────────────────────────────────────────────
router
  .route("/:postId")
  // Get a single post
  .get(authMiddleware, getPostById)
  // Edit post content
  .patch(authMiddleware, editPost)
  // Delete a post
  .delete(authMiddleware, deletePost);

// ── Likes ───────────────────────────────────────────────────────────────────
router.patch("/:postId/like", authMiddleware, toggleLike);

// ── Reshares ────────────────────────────────────────────────────────────────
router.post("/:postId/reshare", authMiddleware, resharePost);

// ── Comments ────────────────────────────────────────────────────────────────
router
  .route("/:postId/comments")
  // Add a comment (with validation)
  .post(
    authMiddleware,
    [
      check("text")
        .trim()
        .notEmpty()
        .withMessage("Comment text is required")
        .isLength({ max: 500 })
        .withMessage("Comment cannot exceed 500 characters"),
    ],
    addComment
  );

router
  .route("/:postId/comments/:commentId")
  // Edit a comment
  .patch(authMiddleware, editComment)
  // Delete a comment
  .delete(authMiddleware, deleteComment);

// ── Save / Unsave a post ───────────────────────────────────────────
router.patch("/:postId/save", authMiddleware, toggleSavePost);

//  user save posts
router.get("/user/saved", authMiddleware, getSavedPosts);

router.get("/user/:userId", authMiddleware, getPostsByUser);
module.exports = router;
