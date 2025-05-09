import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import PostCard from "./PostCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { toast } from "sonner";

export default function MyPosts() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const response = await api.get(`/posts/user/${user._id}`);
        setPosts(response.data.posts); // Adjusted for backend response structure
      } catch (err) {
        console.error("Failed to fetch my posts:", err);
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchMyPosts();
    }
  }, [user._id]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handlePostCreated = ({ post }) => {
      if (post.author._id === user._id) {
        setPosts((prev) => [post, ...prev]);
        console.log(
          `Socket postCreated: postId=${post._id}, userId=${user._id}`
        );
      }
    };

    const handlePostUpdated = ({ postId, content, updatedAt, post }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, content, updatedAt, ...post } : p
        )
      );
      console.log(`Socket postUpdated: postId=${postId}, userId=${user._id}`);
    };

    const handlePostDeleted = ({ postId }) => {
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      console.log(`Socket postDeleted: postId=${postId}, userId=${user._id}`);
    };

    const handleLikeUpdated = ({
      postId,
      userId,
      isLiked,
      likesCount,
      likes,
    }) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return { ...post, likes, likesCount };
          }
          return post;
        })
      );
      console.log(
        `Socket likeUpdated: postId=${postId}, userId=${userId}, isLiked=${isLiked}, likesCount=${likesCount}`
      );
    };

    const handleCommentAdded = ({ postId, comment }) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), comment],
              commentsCount: (post.commentsCount || 0) + 1,
            };
          }
          return post;
        })
      );
      console.log(
        `Socket commentAdded: postId=${postId}, commentId=${comment._id}`
      );
    };

    const handleCommentEdited = ({ postId, commentId, text }) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments?.map((c) =>
                c._id === commentId ? { ...c, text } : c
              ),
            };
          }
          return post;
        })
      );
      console.log(
        `Socket commentEdited: postId=${postId}, commentId=${commentId}`
      );
    };

    const handleCommentDeleted = ({ postId, commentId }) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments?.filter((c) => c._id !== commentId),
              commentsCount: Math.max((post.commentsCount || 1) - 1, 0),
            };
          }
          return post;
        })
      );
      console.log(
        `Socket commentDeleted: postId=${postId}, commentId=${commentId}`
      );
    };

    socket.on("postCreated", handlePostCreated);
    socket.on("postUpdated", handlePostUpdated);
    socket.on("postDeleted", handlePostDeleted);
    socket.on("likeUpdated", handleLikeUpdated);
    socket.on("commentAdded", handleCommentAdded);
    socket.on("commentEdited", handleCommentEdited);
    socket.on("commentDeleted", handleCommentDeleted);

    return () => {
      socket.off("postCreated", handlePostCreated);
      socket.off("postUpdated", handlePostUpdated);
      socket.off("postDeleted", handlePostDeleted);
      socket.off("likeUpdated", handleLikeUpdated);
      socket.off("commentAdded", handleCommentAdded);
      socket.off("commentEdited", handleCommentEdited);
      socket.off("commentDeleted", handleCommentDeleted);
    };
  }, [socket, user._id]);

  // Handlers for post actions
  const handleLike = async (postId) => {
    try {
      const requestId = crypto.randomUUID();
      console.log(
        `Sending like request: postId=${postId}, userId=${user._id}, requestId=${requestId}`
      );
      const response = await api.patch(`/posts/${postId}/like`, { requestId });
      const { isLiked, likesCount, likes } = response.data;
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, likes, likesCount } : post
        )
      );
      socket?.emit("likeUpdated", {
        postId,
        userId: user._id,
        isLiked,
        likesCount,
        likes,
        requestId,
      });
      console.log(
        `Like response: postId=${postId}, userId=${user._id}, isLiked=${isLiked}, likesCount=${likesCount}, requestId=${requestId}`
      );
    } catch (err) {
      toast.error("Failed to like post");
      console.error(
        `Failed to like postId=${postId}:`,
        err.response?.data || err.message
      );
    }
  };

  const handleDelete = async (postId) => {
    toast("Delete this post?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await api.delete(`/posts/${postId}`);
            socket?.emit("postDeleted", { postId });
            toast.success("Post deleted successfully");
            console.log(`Post deleted: postId=${postId}, userId=${user._id}`);
          } catch (err) {
            toast.error("Failed to delete post");
            console.error(
              `Failed to delete postId=${postId}:`,
              err.response?.data || err.message
            );
          }
        },
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleComment = (postId) => {
    navigate(`/post/${postId}`);
    console.log(`Navigating to comments: postId=${postId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          My Posts
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            You haven't created any posts yet.
          </p>
          <button
            onClick={() => navigate("/create")}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PostCard
                post={post}
                user={user}
                onLike={handleLike}
                onDelete={handleDelete}
                onComment={handleComment}
                showSaveButton={false}
                showDeleteOption={true}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
