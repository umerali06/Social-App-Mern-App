import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FiBookmark, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SavedPosts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch saved posts
  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/posts/user/saved");
      setSavedPosts(response.data.posts || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch saved posts:", err);
      setError("Failed to load saved posts. Please try again.");
      toast.error("Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchSavedPosts();
    }
  }, [user?._id]);

  // Handle unsave post
  const handleUnsavePost = async (postId) => {
    try {
      await api.patch(`/posts/${postId}/save`);
      setSavedPosts((prev) => prev.filter((post) => post._id !== postId));
      toast.success("Post unsaved");
    } catch (err) {
      console.error("Failed to unsave post:", err);
      toast.error("Failed to unsave post");
    }
  };

  // Render loading skeletons
  const renderLoadingSkeletons = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <div className="flex space-x-4 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <FiBookmark className="text-gray-400 dark:text-gray-500 text-4xl" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No saved posts yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          When you save posts, they'll appear here for easy access later.
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          Explore Posts
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="flex items-center gap-2"
        >
          <FiArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Saved Posts
        </h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
          <Button
            onClick={fetchSavedPosts}
            variant="ghost"
            size="sm"
            className="ml-2 text-red-700 dark:text-red-300"
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        renderLoadingSkeletons()
      ) : (
        <AnimatePresence>
          {savedPosts.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-6">
              {savedPosts.map((post) => (
                <motion.div
                  key={post._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                  <PostCard
                    post={post}
                    user={user}
                    onSave={() => handleUnsavePost(post._id)}
                    showSaveButton={true}
                    showDeleteOption={false}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
