const catchAsync = require("../utils/catchAsync");
const postService = require("../services/post.service");

/**
 * POST /api/posts
 */
exports.createPost = catchAsync(async (req, res) => {
  const { content, mediaUrl, scheduledAt } = req.body;

  // Ensure that req.user._id is populated
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const post = await postService.createPost({
    author: req.user._id, // Set the author to the authenticated user's ID
    content,
    mediaUrl,
    scheduledAt,
  });

  res.status(201).json(post); // Return the created post
});

/**
 * GET /api/posts
 */
exports.getFeed = catchAsync(async (_req, res) => {
  const feed = await postService.getFeed();
  res.status(200).json(feed); // Return the feed
});

/**
 * POST /api/posts/:postId/like
 */
exports.likePost = catchAsync(async (req, res) => {
  const post = await postService.toggleLike({
    postId: req.params.postId,
    userId: req.user._id, // Get user ID from request (authenticated user)
  });
  res.status(200).json(post); // Return the updated post with like status
});

exports.toggleLike = async ({ postId, userId }) => {
  const post = await Post.findById(postId);

  // Check if the post is already liked by the user
  if (post.likes.includes(userId)) {
    // If liked, remove the like
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    // If not liked, add the like
    post.likes.push(userId);
  }

  await post.save(); // Save the updated post
  return post; // Return the updated post
};
