const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to populate post data
const populatePost = async (postId, populateFields = []) => {
  try {
    if (!isValidObjectId(postId)) {
      throw new Error("Invalid post ID");
    }
    const populateOptions = {
      author: "name profilePicture",
      savedBy: "_id name profilePicture",
      sharedFrom: "author content mediaUrl",
      "comments.user": "name profilePicture",
      likes: "_id name profilePicture",
    };

    const fields =
      populateFields.length > 0
        ? populateFields.map((field) => ({
            path: field,
            select: populateOptions[field],
          }))
        : Object.keys(populateOptions).map((field) => ({
            path: field,
            select: populateOptions[field],
          }));

    const post = await Post.findById(postId).populate(fields).lean();
    if (!post) throw new Error("Post not found");
    return post;
  } catch (err) {
    console.error(`Populate post error for postId ${postId}: ${err.message}`);
    throw new Error(`Failed to populate post: ${err.message}`);
  }
};

// Create a post
const createPost = async (req, res) => {
  try {
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }
    const { content, scheduledAt } = req.body;
    const mediaUrl = req.file ? req.file.path : null;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Post must have content or media",
      });
    }

    const post = await Post.create({
      author: req.user._id,
      content,
      mediaUrl,
      scheduledAt,
    });

    const populatedPost = await populatePost(post._id, [
      "author",
      "comments.user",
      "savedBy",
    ]);

    req.app.get("io").emit("postCreated", {
      post: populatedPost,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (err) {
    console.error(`Create post error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: err.message,
    });
  }
};

// Get all posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name profilePicture")
      .populate("savedBy", "_id name profilePicture")
      .populate("comments.user", "name profilePicture")
      .populate("likes", "_id name profilePicture")
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No posts found",
      });
    }

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (err) {
    console.error(`Get all posts error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to get posts",
      error: err.message,
    });
  }
};

// Get single post
const getPostById = async (req, res) => {
  try {
    const post = await populatePost(req.params.postId);

    res.json({
      success: true,
      post,
    });
  } catch (err) {
    console.error(`Get post by ID error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
      error: err.message,
    });
  }
};

// Like/Unlike a post
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate("author", "name");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);
    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      update,
      { new: true }
    ).populate("author", "name");

    console.log("[LIKE] Post updated:", {
      postId,
      userId,
      isLiked: !isLiked,
      likes: updatedPost.likes,
    });

    // Create like update event
    const likeUpdateEvent = {
      postId,
      userId,
      isLiked: !isLiked,
      likes: updatedPost.likes,
      timestamp: new Date(),
    };

    // Send response first
    res.json({
      success: true,
      isLiked: !isLiked,
      likes: updatedPost.likes,
    });

    // Emit socket event
    req.app.get("io").emit("likeUpdated", likeUpdateEvent);
    console.log("[LIKE] Emitted likeUpdated event:", likeUpdateEvent);

    // Send notification only when liking (not when unliking)
    if (!isLiked && post.author._id.toString() !== userId.toString()) {
      const notification = {
        recipient: post.author._id,
        sender: userId,
        type: "like",
        post: postId,
        message: `${req.user.name} liked your post`,
      };

      // Check for recent notifications
      const recentNotification = await Notification.findOne({
        recipient: post.author._id,
        sender: userId,
        type: "like",
        post: postId,
        createdAt: { $gte: new Date(Date.now() - 1000) }, // Within last second
      });

      if (!recentNotification) {
        const newNotification = await Notification.create(notification);
        // Emit to specific user's room
        req.app.get("io").to(post.author._id.toString()).emit("newNotification", {
          _id: newNotification._id,
          type: "like",
          sender: { _id: userId, name: req.user.name },
          message: `${req.user.name} liked your post`,
          link: `/post/${postId}`,
          createdAt: newNotification.createdAt,
        });
        console.log("[LIKE] Sent notification:", newNotification);
      } else {
        console.log("[LIKE] Skipped duplicate notification");
      }
    }
  } catch (error) {
    console.error("[LIKE] Error:", error);
    res.status(500).json({ message: "Error toggling like" });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const newComment = {
      user: req.user._id,
      text: text.trim(),
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("author", "name profilePicture")
      .populate("comments.user", "name profilePicture");

    const addedComment = updatedPost.comments.find(
      (c) =>
        c.text === newComment.text &&
        c.user.toString() === req.user._id.toString()
    );

    req.app.get("io").emit("commentAdded", {
      postId: post._id,
      comment: addedComment,
      post: updatedPost,
    });

    if (post.author.toString() !== req.user._id.toString()) {
      const user = await User.findById(req.user._id).select("name");
      if (!user) {
        console.warn(`User not found for notification: ${req.user._id}`);
      } else {
        const notification = await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          post: post._id,
          type: "comment",
          message: `${user.name} commented on your post: ${text.trim()}`,
        });

        req.app
          .get("io")
          .to(post.author.toString())
          .emit("newNotification", {
            _id: notification._id,
            type: "comment",
            sender: { _id: user._id, name: user.name },
            message: `${user.name} commented on your post`,
            link: `/post/${post._id}`,
            createdAt: notification.createdAt,
          });
      }
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: addedComment,
      post: updatedPost,
    });
  } catch (err) {
    console.error(
      `Add comment error for postId ${req.params.postId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: err.message,
    });
  }
};

// Edit comment
const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post or comment ID",
      });
    }
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to edit this comment",
      });
    }

    comment.text = text;
    comment.updatedAt = new Date();
    await post.save();

    const populatedPost = await populatePost(postId, [
      "author",
      "comments.user",
    ]);

    req.app.get("io").emit("commentEdited", {
      postId: post._id,
      commentId: comment._id,
      text: comment.text,
      post: populatedPost,
    });

    res.json({
      success: true,
      message: "Comment updated successfully",
      comment,
      post: populatedPost,
    });
  } catch (err) {
    console.error(
      `Edit comment error for postId ${req.params.postId}, commentId ${req.params.commentId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to update comment",
      error: err.message,
    });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post or comment ID",
      });
    }
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this comment",
      });
    }

    post.comments.pull(commentId);
    await post.save();

    const populatedPost = await populatePost(postId, [
      "author",
      "comments.user",
    ]);

    req.app.get("io").emit("commentDeleted", {
      postId,
      commentId,
      post: populatedPost,
    });

    res.json({
      success: true,
      message: "Comment deleted successfully",
      post: populatedPost,
    });
  } catch (err) {
    console.error(
      `Delete comment error for postId ${req.params.postId}, commentId ${req.params.commentId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: err.message,
    });
  }
};

// Edit post
const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to edit this post",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Post content cannot be empty",
      });
    }

    post.content = content;
    post.updatedAt = new Date();
    await post.save();

    const populatedPost = await populatePost(postId, [
      "author",
      "comments.user",
      "savedBy",
    ]);

    req.app.get("io").emit("postUpdated", {
      postId,
      content,
      updatedAt: post.updatedAt,
      post: populatedPost,
    });

    res.json({
      success: true,
      message: "Post updated successfully",
      post: populatedPost,
    });
  } catch (err) {
    console.error(
      `Edit post error for postId ${req.params.postId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: err.message,
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this post",
      });
    }

    await post.deleteOne();

    req.app.get("io").emit("postDeleted", { postId });

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error(
      `Delete post error for postId ${req.params.postId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: err.message,
    });
  }
};

// Reshare post
const resharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Check if user has already reshared this post
    const existingReshare = await Post.findOne({
      author: userId,
      sharedFrom: postId
    });

    if (existingReshare) {
      return res.status(400).json({ 
        success: false,
        message: "You have already reshared this post" 
      });
    }

    const originalPost = await Post.findById(postId)
      .populate("author", "name profilePicture")
      .populate("sharedFrom", "author content");

    if (!originalPost) {
      return res.status(404).json({ 
        success: false,
        // message: "Post not found" 
      });
    }

    // Prevent resharing your own post
    if (originalPost.author._id.toString() === userId.toString()) {
      return res.status(400).json({ 
        success: false,
        message: "You cannot reshare your own post" 
      });
    }

    const reshare = await Post.create({
      author: userId,
      content: originalPost.content,
      sharedFrom: originalPost._id,
      mediaUrl: originalPost.mediaUrl,
    });

    const populatedReshare = await Post.findById(reshare._id)
      .populate("author", "name profilePicture")
      .populate("sharedFrom", "author content");

    const io = req.app.get("io");

    // Emit to all users for real-time feed update
    io.emit("postCreated", { 
      post: populatedReshare, 
      userId,
      type: "reshare",
      isNewReshare: true
    });

    // Create notification for original post author
    if (originalPost.author._id.toString() !== userId.toString()) {
      const notification = await Notification.create({
        recipient: originalPost.author._id,
        sender: userId,
        post: originalPost._id,
        type: "reshare",
        message: `${req.user.name} reshared your post`
      });

      io.to(originalPost.author._id.toString()).emit("newNotification", {
        _id: notification._id,
        type: "reshare",
        sender: { _id: userId, name: req.user.name },
        post: originalPost._id,
        createdAt: notification.createdAt
      });
    }

    res.status(201).json({
      success: true,
      post: populatedReshare
    });
  } catch (err) {
    console.error("Reshare error:", err);
    res.status(500).json({ 
      success: false,
      // message: "Failed to reshare post", 
      error: err.message 
    });
  }
};

// Save/Unsave post
const toggleSavePost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isSaved = post.savedBy.includes(userId);
    const update = isSaved
      ? { $pull: { savedBy: userId } }
      : { $addToSet: { savedBy: userId } };

    const updatedPost = await Post.findOneAndUpdate({ _id: postId }, update, {
      new: true,
    });
    if (!updatedPost) {
      return res.status(500).json({
        success: false,
        message: "Failed to update save status",
      });
    }

    const populatedPost = await populatePost(postId, ["author", "savedBy"]);
    if (!populatedPost) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch updated post",
      });
    }

    console.log(
      `Save toggled for postId ${postId}: isSaved=${!isSaved}, savedByCount=${populatedPost.savedBy.length}`
    );

    req.app.get("io").emit("postSaved", {
      postId,
      userId,
      isSaved: !isSaved,
      savedBy: updatedPost.savedBy,
      post: populatedPost,
    });

    res.json({
      success: true,
      message: isSaved ? "Post unsaved" : "Post saved",
      isSaved: !isSaved,
      post: populatedPost,
    });
  } catch (err) {
    console.error(
      `Toggle save error for postId ${req.params.postId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to toggle save status",
      error: err.message,
    });
  }
};

// Get saved posts
const getSavedPosts = async (req, res) => {
  try {
    if (!req.user || !req.user._id || !isValidObjectId(req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing user",
      });
    }
    const posts = await Post.find({ savedBy: req.user._id })
      .populate("author", "name profilePicture")
      .populate("savedBy", "_id name profilePicture")
      .populate("comments.user", "name profilePicture")
      .populate("likes", "_id name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (err) {
    console.error(`Get saved posts error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved posts",
      error: err.message,
    });
  }
};

// Get posts by user
const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const posts = await Post.find({ author: userId })
      .populate("author", "name profilePicture")
      .populate("savedBy", "_id name profilePicture")
      .populate("comments.user", "name profilePicture")
      .populate("likes", "_id name profilePicture")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts,
    });
  } catch (err) {
    console.error(
      `Get posts by user error for userId ${req.params.userId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch user posts",
      error: err.message,
    });
  }
};

module.exports = {
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
};