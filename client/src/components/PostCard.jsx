/* eslint-disable react-hooks/rules-of-hooks */
import {
  ThumbsUp,
  Repeat2,
  Trash2,
  MessageCircle,
  Smile,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Check,
  Loader2,
  MoreVertical,
  Share2,
  Bookmark,
} from "lucide-react";
import UserStatus from "./UserStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef, useEffect, useCallback } from "react";
import Picker from "emoji-picker-react";
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import { toast } from "sonner";
import { highlightMatch } from "../utils/highlightMatch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function PostCard({
  post,
  user,
  onLike,
  onReshare,
  onDelete,
  onComment,
  onEdit,
  onSave,
  searchQuery,
  showSaveButton = true,
  showDeleteOption = false,
}) {
  const navigate = useNavigate();
  const { socket } = useSocket();

  if (!post?.author || !user?._id) {
    console.warn("Invalid post or user data:", { post, user });
    return null;
  }

  // State management
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSaved, setIsSaved] = useState(
    post.savedBy?.some(
      (savedUser) => savedUser?._id.toString() === user?._id.toString()
    ) || false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || "");
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localPost, setLocalPost] = useState({
    ...post,
    likes: post.likes || [],
    savedBy: post.savedBy || [],
  });
  const [isLiking, setIsLiking] = useState(false);
  const [lastRequestId, setLastRequestId] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const textareaRef = useRef(null);
  const pickerRef = useRef(null);
  const commentRef = useRef(null);

  // Check socket connection
  useEffect(() => {
    if (socket) {
      setIsSocketConnected(socket.connected);

      const handleConnect = () => {
        console.log("Socket connected");
        setIsSocketConnected(true);
      };

      const handleDisconnect = () => {
        console.log("Socket disconnected");
        setIsSocketConnected(false);
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      };
    }
  }, [socket]);

  // Like handler
  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    const requestId = uuidv4();
    setLastRequestId(requestId);

    try {
      console.log("Sending like request:", {
        postId: localPost._id,
        requestId,
        isSocketConnected,
      });

      const response = await api.patch(`/posts/${localPost._id}/like`, {
        requestId,
      });

      const {
        likes,
        isLiked: serverIsLiked,
        requestId: responseRequestId,
      } = response.data;

      console.log("Received like response:", {
        postId: localPost._id,
        likes,
        serverIsLiked,
        responseRequestId,
      });

      if (responseRequestId !== requestId) {
        console.warn(
          `Mismatched requestId: expected=${requestId}, received=${responseRequestId}`
        );
        return;
      }

      // Update local state with server response
      setLocalPost((prev) => {
        const updatedLikes = Array.isArray(likes) ? likes : prev.likes || [];
        console.log("Updating local state with server response:", {
          postId: localPost._id,
          likes: updatedLikes,
          serverIsLiked,
          requestId,
        });
        return {
          ...prev,
          likes: updatedLikes,
        };
      });

      if (typeof onLike === "function") {
        onLike(localPost._id, serverIsLiked);
      }

      toast.success(serverIsLiked ? "Post liked" : "Post unliked");
    } catch (err) {
      console.error("Like action failed:", {
        error: err.response?.data || err,
        requestId,
      });
      toast.error(
        `Failed to update like: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, localPost._id, onLike, isSocketConnected]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isSocketConnected) {
      console.warn("Socket not initialized or not connected");
      return;
    }

    const handleLikeUpdated = ({
      postId,
      likes,
      isLiked: serverIsLiked,
      userId,
      requestId,
      timestamp,
    }) => {
      if (postId === localPost._id) {
        console.log("Received likeUpdated event:", {
          postId,
          likes,
          serverIsLiked,
          userId,
          requestId,
          timestamp,
        });

        setLocalPost((prev) => {
          const updatedLikes = Array.isArray(likes) ? likes : prev.likes || [];
          console.log("Updating local state from socket:", {
            postId,
            likes: updatedLikes,
            serverIsLiked,
            requestId,
          });
          return {
            ...prev,
            likes: updatedLikes,
          };
        });
      }
    };

    const handlePostUpdated = ({ post }) => {
      if (post._id === localPost._id) {
        setLocalPost({
          ...post,
          likes: post.likes || [],
          savedBy: post.savedBy || [],
        });
        setComments(post.comments || []);
        setEditMode(false);
        setEditedContent(post.content || "");
        console.log("Received postUpdated:", { postId: post._id, post });
      }
    };

    const handlePostDeleted = ({ postId }) => {
      if (postId === localPost._id && typeof onDelete === "function") {
        onDelete(postId);
        console.log("Received postDeleted:", { postId });
      }
    };

    const handleCommentAdded = ({ postId, comment, post }) => {
      if (postId === localPost._id) {
        setComments(post.comments || []);
        console.log("Received commentAdded:", { postId, comment });
      }
    };

    const handleCommentEdited = ({ postId, commentId, text, post }) => {
      if (postId === localPost._id) {
        setComments(post.comments || []);
        if (editCommentId === commentId) {
          setEditCommentId(null);
          setEditCommentText("");
        }
        console.log("Received commentEdited:", { postId, commentId, text });
      }
    };

    const handleCommentDeleted = ({ postId, commentId, post }) => {
      if (postId === localPost._id) {
        setComments(post.comments || []);
        console.log("Received commentDeleted:", { postId, commentId });
      }
    };

    const handlePostSaved = ({
      postId,
      isSaved: savedStatus,
      post,
      userId,
    }) => {
      if (postId === localPost._id && userId === user._id) {
        setLocalPost({
          ...post,
          likes: post.likes || [],
          savedBy: post.savedBy || [],
        });
        setIsSaved(savedStatus);
        console.log("Received postSaved:", {
          postId,
          savedStatus,
          savedBy: post.savedBy,
        });
      }
    };

    const handlePostCreated = ({ post, userId, type, isNewReshare }) => {
      if (type === "reshare" && post.sharedFrom?._id === localPost._id) {
        if (userId === user._id && isNewReshare) {
          toast.success("Post reshared successfully");
        }
        if (typeof onReshare === "function") {
          onReshare(localPost._id);
        }
      }
    };

    socket.on("likeUpdated", handleLikeUpdated);
    socket.on("postUpdated", handlePostUpdated);
    socket.on("postDeleted", handlePostDeleted);
    socket.on("commentAdded", handleCommentAdded);
    socket.on("commentEdited", handleCommentEdited);
    socket.on("commentDeleted", handleCommentDeleted);
    socket.on("postSaved", handlePostSaved);
    socket.on("postCreated", handlePostCreated);

    return () => {
      socket.off("likeUpdated", handleLikeUpdated);
      socket.off("postUpdated", handlePostUpdated);
      socket.off("postDeleted", handlePostDeleted);
      socket.off("commentAdded", handleCommentAdded);
      socket.off("commentEdited", handleCommentEdited);
      socket.off("commentDeleted", handleCommentDeleted);
      socket.off("postSaved", handlePostSaved);
      socket.off("postCreated", handlePostCreated);
    };
  }, [
    socket,
    localPost._id,
    user._id,
    onDelete,
    onReshare,
    editCommentId,
    lastRequestId,
    isSocketConnected,
  ]);

  const handleDeletePost = async () => {
    toast("Delete this post?", {
      action: {
        label: "Delete",
        onClick: async () => {
          setIsDeleting(true);
          try {
            await api.delete(`/posts/${localPost._id}`);
            toast.success("Post deleted successfully");
            if (typeof onDelete === "function") {
              onDelete(localPost._id);
            }
          } catch (err) {
            toast.error(
              `Failed to delete post: ${err.response?.data?.message || err.message}`
            );
            console.error("Failed to delete post:", err.response?.data || err);
          } finally {
            setIsDeleting(false);
          }
        },
      },
      cancel: { label: "Cancel" },
    });
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const response = await api.patch(`/posts/${localPost._id}`, {
        content: editedContent,
      });
      const updatedPost = response.data.post || {};
      setLocalPost({
        ...updatedPost,
        likes: updatedPost.likes || [],
        savedBy: updatedPost.savedBy || [],
      });
      setEditMode(false);
      if (typeof onEdit === "function") {
        onEdit(updatedPost);
      }
      toast.success("Post updated successfully");
      console.log("Edit successful:", response.data);
    } catch (err) {
      toast.error(
        `Failed to update post: ${err.response?.data?.message || err.message}`
      );
      console.error("Failed to update post:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    const prevSaved = isSaved;

    // Optimistic UI update
    setIsSaved(!isSaved);
    setLocalPost((prev) => ({
      ...prev,
      savedBy: !isSaved
        ? [...(prev.savedBy || []), { _id: user._id, name: user.name }]
        : prev.savedBy?.filter(
            (u) => u?._id.toString() !== user?._id.toString()
          ) || [],
    }));
    console.log("Optimistic save update:", {
      postId: localPost._id,
      isSaved: !isSaved,
    });

    try {
      const response = await api.patch(`/posts/${localPost._id}/save`);
      const updatedPost = response.data.post || {};
      setLocalPost((prev) => ({
        ...prev,
        savedBy: updatedPost.savedBy || prev.savedBy || [],
      }));
      setIsSaved(response.data.isSaved);
      if (typeof onSave === "function") {
        onSave(localPost._id, response.data.isSaved);
      }
      toast.success(
        `Post ${response.data.isSaved ? "saved" : "unsaved"} successfully`
      );
      console.log("Save successful:", response.data);
    } catch (err) {
      toast.error(
        `Failed to ${prevSaved ? "unsave" : "save"} post: ${err.response?.data?.message || err.message}`
      );
      console.error(
        `Failed to ${prevSaved ? "unsave" : "save"} post:`,
        err.response?.data || err
      );
      setIsSaved(prevSaved);
      setLocalPost((prev) => ({
        ...prev,
        savedBy: prevSaved
          ? [...(prev.savedBy || []), { _id: user._id, name: user.name }]
          : prev.savedBy?.filter(
              (u) => u?._id.toString() !== user?._id.toString()
            ) || [],
      }));
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, isSaved, localPost._id, user._id, user.name, onSave]);

  const handleAddComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);

    try {
      const response = await api.post(`/posts/${localPost._id}/comments`, {
        text: commentText.trim(),
      });
      const addedComment = response.data.comment || {};
      setCommentText("");
      if (typeof onComment === "function") {
        onComment(localPost._id);
      }
      toast.success("Comment added successfully");
      console.log("Comment added:", response.data);
    } catch (err) {
      toast.error(
        `Failed to add comment: ${err.response?.data?.message || err.message}`
      );
      console.error("Failed to add comment:", err.response?.data || err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleEditComment = (commentId, text) => {
    setEditCommentId(commentId);
    setEditCommentText(text || "");
  };

  const handleSaveEditedComment = async () => {
    if (!editCommentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      await api.patch(`/posts/${localPost._id}/comments/${editCommentId}`, {
        text: editCommentText,
      });
      setEditCommentId(null);
      setEditCommentText("");
      toast.success("Comment updated successfully");
      console.log("Comment edited successfully");
    } catch (err) {
      toast.error(
        `Failed to edit comment: ${err.response?.data?.message || err.message}`
      );
      console.error("Failed to edit comment:", err.response?.data || err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    toast("Delete this comment?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await api.delete(`/posts/${localPost._id}/comments/${commentId}`);
            toast.success("Comment deleted successfully");
            console.log("Comment deleted:", commentId);
          } catch (err) {
            toast.error(
              `Failed to delete comment: ${err.response?.data?.message || err.message}`
            );
            console.error(
              "Failed to delete comment:",
              err.response?.data || err
            );
          }
        },
      },
      cancel: { label: "Cancel" },
    });
  };

  const handleReshareConfirm = () => {
    toast("Are you sure you want to reshare this post?", {
      action: {
        label: "Reshare",
        onClick: async () => {
          try {
            const response = await api.post(`/posts/${localPost._id}/reshare`);
            if (response.data.success && typeof onReshare === "function") {
              onReshare(localPost._id);
            }
          } catch (err) {
            // No toast for errors
          }
        },
      },
      cancel: { label: "Cancel" },
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/post/${localPost._id}`
    );
    toast.success("Link copied to clipboard");
  };

  const handleEmojiClick = (emojiData) => {
    setCommentText((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    commentRef.current?.focus();
  };

  useEffect(() => {
    if (editMode && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [editMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const commentsToShow = showAllComments ? comments : comments.slice(-2);
  const hasMoreComments = comments.length > 2;

  // Derived values
  const isLiked = Array.isArray(localPost.likes)
    ? localPost.likes.some((like) => {
        if (typeof like === "object" && like !== null) {
          return like._id?.toString() === user?._id.toString();
        }
        return like?.toString() === user?._id.toString();
      })
    : false;

  const isAuthor = localPost.author?._id.toString() === user?._id.toString();
  const isReshared =
    localPost.sharedFrom?._id?.toString() === user?._id.toString();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <Card className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <UserStatus
              userId={localPost.author?._id}
              name={highlightMatch(
                localPost.author.name || "",
                searchQuery || ""
              )}
              avatarUrl={localPost.author.profilePicture}
              size="lg"
              dangerouslyRenderName
              subText={
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(localPost.createdAt))} ago
                  {localPost.updatedAt &&
                    localPost.updatedAt !== localPost.createdAt &&
                    " (edited)"}
                </span>
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 dark:text-white">
                {isAuthor && (
                  <DropdownMenuItem
                    onClick={() => setEditMode(true)}
                    className="cursor-pointer"
                  >
                    <Pencil size={14} className="mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleCopyLink}
                  className="cursor-pointer"
                >
                  <Share2 size={14} className="mr-2" />
                  Copy Link
                </DropdownMenuItem>
                {showSaveButton && (
                  <DropdownMenuItem
                    onClick={handleSavePost}
                    className="cursor-pointer"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <Bookmark size={14} className="mr-2" />
                    )}
                    {isSaved ? "Unsave" : "Save"}
                  </DropdownMenuItem>
                )}
                {(isAuthor || showDeleteOption) && (
                  <DropdownMenuItem
                    onClick={handleDeletePost}
                    className="cursor-pointer text-red-600"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <Trash2 size={14} className="mr-2" />
                    )}
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reshared Indicator */}
          {localPost.sharedFrom && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-purple-500 dark:text-purple-400 italic flex items-center"
            >
              <Repeat2 size={14} className="mr-1" />
              Reshared Post
            </motion.div>
          )}

          {/* Post Content */}
          {editMode ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <textarea
                ref={textareaRef}
                className="w-full border px-4 py-3 rounded-lg text-sm resize-none dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={1}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading || !editedContent.trim()}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Check size={16} className="mr-2" />
                  )}
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMode(false);
                    setEditedContent(localPost.content || "");
                  }}
                >
                  <X size={14} className="mr-2" />
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-md text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: highlightMatch(localPost.content || "", searchQuery),
              }}
            />
          )}

          {/* Media */}
          {localPost.mediaUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl overflow-hidden max-h-[500px] mt-2 border border-gray-200 dark:border-gray-700"
            >
              {localPost.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  controls
                  className="w-full h-auto max-h-[500px] object-contain"
                >
                  <source src={localPost.mediaUrl} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={localPost.mediaUrl}
                  alt="Post Media"
                  className="w-full h-auto max-h-[500px] object-contain"
                />
              )}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleLike}
                variant="ghost"
                size="sm"
                className={`gap-2 px-3 ${isLiked ? "text-red-500" : "text-gray-500"}`}
                disabled={isLiking}
              >
                {isLiking ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <ThumbsUp size={18} />
                    <span>{localPost.likes?.length || 0}</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => commentRef.current?.focus()}
                variant="ghost"
                size="sm"
                className="gap-2 px-3 text-gray-500"
              >
                <MessageCircle size={18} />
                <span>{comments.length}</span>
              </Button>
              <Button
                onClick={handleReshareConfirm}
                variant="ghost"
                size="sm"
                className={`gap-2 px-3 ${isReshared ? "text-blue-500" : "text-gray-500"}`}
              >
                <Repeat2 size={18} />
              </Button>
            </div>
            {showSaveButton && (
              <Button
                onClick={handleSavePost}
                variant="ghost"
                size="sm"
                className={isSaved ? "text-yellow-500" : "text-gray-500"}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Bookmark
                    size={18}
                    fill={isSaved ? "currentColor" : "none"}
                  />
                )}
              </Button>
            )}
          </div>

          {/* Comment Box */}
          <div className="space-y-3 mt-4">
            <motion.div layout className="flex gap-3 items-start">
              <div className="relative w-full">
                <textarea
                  ref={commentRef}
                  rows={1}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full border resize-none overflow-hidden rounded-full px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 bottom-2.5 text-gray-500 hover:text-yellow-500"
                  onClick={() => setShowEmoji((prev) => !prev)}
                >
                  <Smile size={18} />
                </button>
                <AnimatePresence>
                  {showEmoji && (
                    <motion.div
                      ref={pickerRef}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 mt-2 right-0"
                    >
                      <Picker
                        onEmojiClick={handleEmojiClick}
                        height={350}
                        width={300}
                        previewConfig={{ showPreview: false }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                onClick={handleAddComment}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
                disabled={!commentText.trim() || isCommenting}
              >
                {isCommenting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </motion.div>

            {/* Comments Section */}
            <AnimatePresence>
              {commentsToShow.length > 0 && (
                <motion.div
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {commentsToShow.map((cmt) => (
                    <motion.div
                      key={cmt?._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-sm shadow">
                        {cmt.user?.name?.[0] || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {highlightMatch(
                              cmt.user?.name || "",
                              searchQuery || ""
                            )}
                          </p>
                          {cmt.user?._id.toString() ===
                            user?._id.toString() && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  <MoreVertical size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-40 dark:text-white">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEditComment(cmt?._id, cmt.text)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Pencil size={14} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteComment(cmt?._id)}
                                  className="cursor-pointer text-red-600"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {editCommentId === cmt?._id ? (
                          <div className="mt-1 flex items-center gap-2">
                            <textarea
                              rows={1}
                              value={editCommentText}
                              onChange={(e) =>
                                setEditCommentText(e.target.value)
                              }
                              className="w-full border px-2 py-1 rounded-md text-sm dark:bg-gray-700"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEditedComment}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditCommentId(null);
                                setEditCommentText("");
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug mt-1">
                            {highlightMatch(cmt.text || "", searchQuery || "")}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {hasMoreComments && (
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium flex items-center gap-1"
              >
                {showAllComments ? (
                  <>
                    <ChevronUp size={14} />
                    Show fewer comments
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    Show all comments ({comments.length})
                  </>
                )}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
