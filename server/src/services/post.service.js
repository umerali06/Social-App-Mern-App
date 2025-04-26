// server/src/services/post.service.js
const Post = require("../models/Post"); // Ensure you have a Post model to save the post in the DB

/**
 * Create a new post
 */
const createPost = async (postData) => {
  const post = new Post(postData);
  await post.save(); // Save the post in the database
  return post; // Return the saved post
};

/**
 * Get the feed (all posts, or you can implement more complex logic)
 */
const getFeed = async () => {
  const posts = await Post.find().populate("author", "name email"); // Assuming 'authorId' is a reference to the User model
  return posts;
};

/**
 * Toggle like on a post (like/unlike logic)
 */
const toggleLike = async ({ postId, userId }) => {
  const post = await Post.findById(postId);

  if (!post) throw new Error("Post not found");

  // Check if the user already liked the post
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(
      (like) => like.toString() !== userId.toString()
    );
  } else {
    post.likes.push(userId); // Add user to likes array
  }

  await post.save();
  return post;
};

module.exports = {
  createPost,
  getFeed,
  toggleLike,
};
