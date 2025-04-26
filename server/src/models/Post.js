const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    mediaUrl: {
      type: String, // for video or image uploads
    },
    scheduledAt: {
      type: Date, // future scheduling
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // We’ll handle comments later as subdocuments or separate model
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
