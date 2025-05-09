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
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    console.log(
      `Processing toggleLike: postId=${postId}, userId=${userId}, requestId=${requestId}, timestamp=${timestamp}`
    );

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const post = await Post.findById(postId).session(session);
      if (!post) {
        throw new Error("Post not found");
      }

      const wasLiked = post.likes.includes(userId);
      console.log(
        `Before update: postId=${postId}, userId=${userId}, wasLiked=${wasLiked}, likesCount=${post.likes.length}`
      );

      const update = wasLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } };

      const updatedPost = await Post.findOneAndUpdate({ _id: postId }, update, {
        new: true,
        session,
      }).populate("author", "name profilePicture");
      if (!updatedPost) {
        throw new Error("Failed to update like status");
      }

      const populatedPost = await populatePost(postId, ["likes", "author"]);
      if (!populatedPost) {
        throw new Error("Failed to fetch updated post");
      }

      const isLiked = updatedPost.likes.includes(userId); // Verify state after update
      console.log(
        `After update: postId=${postId}, userId=${userId}, isLiked=${isLiked}, likesCount=${
          populatedPost.likes.length
        }, action=${wasLiked ? "unliked" : "liked"}`
      );

      req.app.get("io").emit("likeUpdated", {
        postId,
        userId,
        isLiked,
        likesCount: populatedPost.likes.length,
        likes: populatedPost.likes,
        requestId,
        timestamp,
      });

      // Send notification only when the post is liked
      if (isLiked && post.author.toString() !== userId.toString()) {
        const user = await User.findById(userId)
          .select("name")
          .session(session);
        if (!user) {
          console.warn(
            `User not found for notification: ${userId}, requestId=${requestId}`
          );
        } else {
          const recentNotification = await Notification.findOne({
            recipient: post.author,
            sender: userId,
            post: postId,
            type: "like",
            createdAt: { $gte: new Date(Date.now() - 1000) },
          }).session(session);

          if (!recentNotification) {
            const notification = await Notification.create(
              [
                {
                  recipient: post.author,
                  sender: userId,
                  post: postId,
                  type: "like",
                  message: `${user.name} liked your post`,
                },
              ],
              { session }
            );

            console.log(
              `Notification sent: postId=${postId}, recipient=${post.author}, sender=${userId}, requestId=${requestId}, message="${user.name} liked your post"`
            );

            req.app
              .get("io")
              .to(post.author.toString())
              .emit("newNotification", {
                _id: notification[0]._id,
                type: "like",
                sender: { _id: user._id, name: user.name },
                message: `${user.name} liked your post`,
                link: `/post/${postId}`,
                createdAt: notification[0].createdAt,
                requestId,
                timestamp,
              });
          } else {
            console.log(
              `Notification skipped (duplicate): postId=${postId}, userId=${userId}, requestId=${requestId}`
            );
          }
        }
      } else {
        console.log(
          `No notification sent: postId=${postId}, userId=${userId}, requestId=${requestId}, isLiked=${isLiked}, isOwnPost=${post.author.toString() === userId.toString()}`
        );
      }

      res.json({
        success: true,
        message: isLiked ? "Post liked" : "Post unliked",
        likesCount: populatedPost.likes.length,
        likes: populatedPost.likes,
        isLiked,
        requestId,
        timestamp,
      });
    });

    await session.endSession();
  } catch (err) {
    console.error(
      `Toggle like error for postId ${req.params.postId}, requestId=${req.body.requestId || "unknown"}: ${err.message}`
    );
    res.status(err.message === "Post not found" ? 404 : 500).json({
      success: false,
      message: "Failed to toggle like",
      error: err.message,
    });
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

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: "Original post not found",
      });
    }

    const resharedPost = await Post.create({
      author: userId,
      content: originalPost.content,
      mediaUrl: originalPost.mediaUrl,
      sharedFrom: originalPost._id,
    });

    const populatedPost = await populatePost(resharedPost._id, [
      "author",
      "sharedFrom",
    ]);

    req.app.get("io").emit("postCreated", {
      post: populatedPost,
      userId,
    });

    if (originalPost.author.toString() !== userId.toString()) {
      const user = await User.findById(userId).select("name");
      if (!user) {
        console.warn(`User not found for notification: ${userId}`);
      } else {
        const notification = await Notification.create({
          recipient: originalPost.author,
          sender: userId,
          post: originalPost._id,
          type: "reshare",
          message: `${user.name} reshared your post`,
        });

        req.app
          .get("io")
          .to(originalPost.author.toString())
          .emit("newNotification", {
            _id: notification._id,
            type: "reshare",
            sender: { _id: user._id, name: user.name },
            message: `${user.name} reshared your post`,
            link: `/post/${resharedPost._id}`,
            createdAt: notification.createdAt,
          });
      }
    }

    res.status(201).json({
      success: true,
      message: "Post reshared successfully",
      post: populatedPost,
    });
  } catch (err) {
    console.error(
      `Reshare post error for postId ${req.params.postId}: ${err.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to reshare post",
      error: err.message,
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
