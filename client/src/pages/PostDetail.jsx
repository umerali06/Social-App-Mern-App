import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api
      .get(`/posts/${postId}`)
      .then((res) => {
        setPost(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading post:", err);
        setLoading(false);
      });
  }, [postId]);

  const handleCommentChange = (postId, text) => {
    setCommentText((prev) => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = async (postId) => {
    if (!commentText[postId]) return;
    try {
      await api.post(`/posts/${postId}/comment`, { text: commentText[postId] });
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data);
    } catch (err) {
      console.error("Failed to comment:", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.patch(`/posts/${postId}/like`);
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data);
    } catch (err) {
      console.error("Failed to like:", err);
    }
  };

  const handleReshare = async (postId) => {
    try {
      await api.post(`/posts/${postId}/reshare`);
    } catch (err) {
      console.error("Failed to reshare:", err);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-900 px-4 py-10"
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/">
            <Button
              variant="outline"
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-800 rounded-full px-4 py-2 shadow-md border border-gray-300 dark:border-gray-700"
            >
              <ArrowLeft size={16} /> Back to Feed
            </Button>
          </Link>
        </div>

        {loading ? (
          <SkeletonTheme
            baseColor={isDark ? "#2d2d2d" : "#e0e0e0"}
            highlightColor={isDark ? "#3c3c3c" : "#f5f5f5"}
            borderRadius={14}
          >
            <div className="space-y-4">
              <Skeleton height={60} />
              <Skeleton height={240} />
              <Skeleton count={3} height={16} />
              <Skeleton height={80} />
            </div>
          </SkeletonTheme>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl shadow-xl bg-white dark:bg-gray-900 p-1 md:p-3"
          >
            <PostCard
              post={post}
              user={user}
              commentText={commentText}
              onCommentChange={handleCommentChange}
              onAddComment={handleAddComment}
              onLike={handleLike}
              onReshare={handleReshare}
              onDelete={handleDelete}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
