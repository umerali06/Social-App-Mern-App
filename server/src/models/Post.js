const mongoose = require("mongoose");

// Define comment sub-schema
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for the comment"],
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment must have at least one character"],
      maxlength: [500, "Comment text cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required for the post"],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [1000, "Content cannot exceed 1000 characters"],
    },
    mediaUrl: {
      type: String,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema], // ✅ Add comment array
    sharedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // ✅ Allow reshare
      default: null,
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Indexes for performance improvement
postSchema.index({ author: 1 }); // Index by author for faster retrieval of posts by user
postSchema.index({ likes: 1 }); // Index by likes for faster querying of liked posts
postSchema.index({ "comments.user": 1 }); // Index comments by user for faster search of user comments
postSchema.index({ savedBy: 1 }); // Index by saved users for faster querying of saved posts
postSchema.index({ scheduledAt: 1 }); // Index for scheduling posts

// Add virtual field for reshared post
postSchema.virtual("resharedPost", {
  ref: "Post",
  localField: "sharedFrom",
  foreignField: "_id",
  justOne: true,
});

// Add pre-save middleware to ensure post is valid before saving
postSchema.pre("save", async function (next) {
  if (this.sharedFrom) {
    const sharedPost = await mongoose.model("Post").findById(this.sharedFrom);
    if (!sharedPost) {
      throw new Error("Original post not found for reshare");
    }
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
