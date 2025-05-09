import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setMediaFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) {
      toast.warning("Post must contain content or media.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      await api.post("/posts", formData);
      toast.success("Post created successfully!");
      navigate("/");
    } catch (err) {
      console.error("Post creation failed:", err);
      toast.error("Something went wrong while creating the post.");
      setLoading(false);
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
              <Skeleton height={180} />
              <Skeleton height={50} />
              <Skeleton height={48} width={120} />
            </div>
          </SkeletonTheme>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl shadow-xl bg-white dark:bg-gray-900 p-6 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create a New Post
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows="5"
                placeholder="Write your post here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>

              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:rounded file:border-gray-300 file:font-semibold file:bg-gray-100 hover:file:bg-gray-200 dark:file:bg-gray-800 dark:file:text-white dark:hover:file:bg-gray-700"
              />

              {mediaFile && (
                <div className="mt-2">
                  {mediaFile.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(mediaFile)}
                      alt="Preview"
                      className="max-h-48 rounded border"
                    />
                  ) : (
                    <video controls className="max-h-48 rounded border">
                      <source
                        src={URL.createObjectURL(mediaFile)}
                        type={mediaFile.type}
                      />
                    </video>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl shadow-md"
              >
                Post
              </Button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
