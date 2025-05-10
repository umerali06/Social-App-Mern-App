/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../api/axios";
import PostCard from "./PostCard";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import Fuse from "fuse.js";
import { FiSearch, FiX } from "react-icons/fi";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const postRefs = useRef({});
  const searchRef = useRef(null);

  // Enhanced post validation
  const validatePost = (post) => {
    if (!post || typeof post !== "object") {
      console.warn("Invalid post: not an object", post);
      return false;
    }
    if (!post?._id || typeof post?._id !== "string") {
      console.warn("Invalid post: missing or invalid _id", post);
      return false;
    }
    if (
      !post.author ||
      !post.author?._id ||
      typeof post.author?._id !== "string"
    ) {
      console.warn("Invalid post: missing or invalid author._id", post);
      return false;
    }
    return true;
  };

  // Enhanced comment validation
  const validateComment = (comment) => {
    if (!comment || typeof comment !== "object") {
      console.warn("Invalid comment: not an object", comment);
      return false;
    }
    if (!comment?._id || typeof comment?._id !== "string") {
      console.warn("Invalid comment: missing or invalid _id", comment);
      return false;
    }
    if (
      !comment.user ||
      !comment.user?._id ||
      typeof comment.user?._id !== "string"
    ) {
      console.warn("Invalid comment: missing or invalid user._id", comment);
      return false;
    }
    return true;
  };

  // Fetch posts with enhanced error handling
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await api.get("/posts");
        const fetchedPosts = Array.isArray(response.data?.posts)
          ? response.data.posts
          : [];

        console.log("Fetched posts:", fetchedPosts);

        // Filter and validate posts
        const validPosts = fetchedPosts.filter((post) => {
          const isValid = validatePost(post);
          if (!isValid) {
            console.warn("Invalid post filtered out:", post);
          }
          return isValid;
        });

        setPosts(validPosts);
        setFilteredPosts(validPosts);
      } catch (err) {
        console.error("Error loading posts:", err);
        toast.error("Failed to load posts. Please try again later.");
        setPosts([]);
        setFilteredPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Enhanced socket event handlers
  useEffect(() => {
    if (!socket || !user || !user?._id) return;

    const handlePostCreated = (data) => {
      try {
        if (!data?.post || !validatePost(data.post)) {
          console.error("Invalid post creation data:", data);
          return;
        }

        const newPost = {
          ...data.post,
          createdAt: data.post.createdAt
            ? new Date(data.post.createdAt)
            : new Date(),
          comments: Array.isArray(data.post.comments)
            ? data.post.comments.filter(validateComment)
            : [],
          likes: Array.isArray(data.post.likes) ? data.post.likes : [],
          savedBy: Array.isArray(data.post.savedBy) ? data.post.savedBy : [],
        };

        if (validatePost(newPost)) {
          setPosts((prev) => [newPost, ...prev]);
          setFilteredPosts((prev) => [newPost, ...prev]);
          toast.success("New post added!");
        } else {
          console.error("Invalid post data received:", newPost);
        }
      } catch (err) {
        console.error("Error handling post creation:", err);
      }
    };

    const handleCommentAdded = ({ postId, comment }) => {
      try {
        if (!postId || !validateComment(comment)) {
          console.error("Invalid comment data received:", { postId, comment });
          return;
        }
        updatePostsWithComment(postId, comment);
        setTimeout(() => {
          postRefs.current[postId]?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (err) {
        console.error("Error handling comment addition:", err);
      }
    };

    const handleCommentEdited = ({ postId, comment }) => {
      if (!postId || !validateComment(comment)) {
        console.error("Invalid comment edit data:", { postId, comment });
        return;
      }
      editCommentInPosts(postId, comment);
    };

    const handleCommentDeleted = ({ postId, commentId }) => {
      if (!postId || !commentId) {
        console.error("Invalid comment deletion data:", { postId, commentId });
        return;
      }
      deleteCommentInPosts(postId, commentId);
    };

    const handleLikeUpdated = ({ postId, likes, isLiked, userId }) => {
      console.log("Received likeUpdated event:", {
        postId,
        likes,
        isLiked,
        userId,
      });

      if (!postId || !Array.isArray(likes)) {
        console.error("Invalid like update data:", { postId, likes });
        return;
      }

      updateLikesInPosts(postId, likes);
    };

    const handlePostUpdated = ({ post }) => {
      if (!validatePost(post)) {
        console.error("Invalid post update data:", post);
        return;
      }

      setPosts((prev) =>
        prev.map((p) =>
          p?._id === post?._id
            ? {
                ...p,
                content: post.content || p.content,
                updatedAt: post.updatedAt
                  ? new Date(post.updatedAt)
                  : p.updatedAt,
                mediaUrl: post.mediaUrl || p.mediaUrl,
              }
            : p
        )
      );
      setFilteredPosts((prev) =>
        prev.map((p) =>
          p?._id === post?._id
            ? {
                ...p,
                content: post.content || p.content,
                updatedAt: post.updatedAt
                  ? new Date(post.updatedAt)
                  : p.updatedAt,
                mediaUrl: post.mediaUrl || p.mediaUrl,
              }
            : p
        )
      );
      toast.success("Post updated");
    };

    const handlePostDeleted = ({ postId }) => {
      if (!postId) {
        console.error("Invalid post deletion data:", { postId });
        return;
      }
      setPosts((prev) => prev.filter((post) => post?._id !== postId));
      setFilteredPosts((prev) => prev.filter((post) => post?._id !== postId));
      toast.warning("Post was deleted");
    };

    const handleResharePost = ({ post }) => {
      if (!validatePost(post)) {
        console.error("Invalid reshare data:", post);
        return;
      }
      setPosts((prev) => [post, ...prev]);
      setFilteredPosts((prev) => [post, ...prev]);
      toast.info("Post reshared!");
    };

    const handlers = {
      postCreated: handlePostCreated,
      commentAdded: handleCommentAdded,
      commentEdited: handleCommentEdited,
      commentDeleted: handleCommentDeleted,
      likeUpdated: handleLikeUpdated,
      postUpdated: handlePostUpdated,
      postDeleted: handlePostDeleted,
      resharePost: handleResharePost,
    };

    try {
      socket.emit("join", { userId: user?._id, name: user.name });
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    } catch (err) {
      console.error("Error setting up socket listeners:", err);
    }

    return () => {
      Object.keys(handlers).forEach((event) => {
        try {
          socket.off(event);
        } catch (err) {
          console.error(`Error removing ${event} listener:`, err);
        }
      });
    };
  }, [socket, user?._id, user]);

  // Enhanced helper functions with validation
  const updatePostsWithComment = (postId, comment) => {
    if (!validateComment(comment)) {
      console.error("Invalid comment in update:", comment);
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post?._id === postId
          ? {
              ...post,
              comments: Array.isArray(post.comments)
                ? post.comments.some((c) => c?._id === comment?._id)
                  ? post.comments
                  : [...post.comments, comment]
                : [comment],
            }
          : post
      )
    );
    setFilteredPosts((prev) =>
      prev.map((post) =>
        post?._id === postId
          ? {
              ...post,
              comments: Array.isArray(post.comments)
                ? post.comments.some((c) => c?._id === comment?._id)
                  ? post.comments
                  : [...post.comments, comment]
                : [comment],
            }
          : post
      )
    );
  };

  const editCommentInPosts = (postId, comment) => {
    if (!validateComment(comment)) {
      console.error("Invalid comment in edit:", comment);
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post?._id === postId
          ? {
              ...post,
              comments: Array.isArray(post.comments)
                ? post.comments.map((c) =>
                    c?._id === comment?._id ? comment : c
                  )
                : [],
            }
          : post
      )
    );
    setFilteredPosts((prev) =>
      prev.map((post) =>
        post?._id === postId
          ? {
              ...post,
              comments: Array.isArray(post.comments)
                ? post.comments.map((c) =>
                    c?._id === comment?._id ? comment : c
                  )
                : [],
            }
          : post
      )
    );
  };

  const deleteCommentInPosts = (postId, commentId) => {
    if (!postId || !commentId) {
      console.error("Invalid comment deletion:", { postId, commentId });
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post?._id === postId
          ? {
              ...post,
              comments: Array.isArray(post.comments)
                ? post.comments.filter((c) => c?._id !== commentId)
                : [],
            }
          : post
      )
    );
    setFilteredPosts((prev) =>
      prev.map((post) =>
        post?._id === postId
          ? {
              ...post,
              comments: Array.isArray(post.comments)
                ? post.comments.filter((c) => c?._id !== commentId)
                : [],
            }
          : post
      )
    );
  };

  const updateLikesInPosts = (postId, likes) => {
    if (!postId || !Array.isArray(likes)) {
      console.error("Invalid likes update:", { postId, likes });
      return;
    }

    console.log("Updating likes in posts:", { postId, likes });

    setPosts((prev) =>
      prev.map((post) => {
        if (post?._id === postId) {
          console.log("Updating post likes:", {
            postId,
            oldLikes: post.likes,
            newLikes: likes,
          });
          return { ...post, likes };
        }
        return post;
      })
    );

    setFilteredPosts((prev) =>
      prev.map((post) => {
        if (post?._id === postId) {
          return { ...post, likes };
        }
        return post;
      })
    );
  };

  // Enhanced handlers with validation
  const handleCommentChange = (postId, text) => {
    if (!postId || typeof text !== "string") {
      console.error("Invalid comment change:", { postId, text });
      return;
    }
    setCommentText((prev) => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = async (postId) => {
    if (!postId || !user?._id) {
      console.error("Invalid comment addition:", { postId, user });
      console.error("User is not logged in or missing user._id");
      return;
    }

    const text = commentText[postId]?.trim();
    if (!text) {
      toast.warning("Comment cannot be empty");
      return;
    }

    try {
      await api.post(`/posts/${postId}/comment`, { text });
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to add comment. Please try again.",
        err.response?.data || err
      );
    }
  };

  const handleLike = async (postId) => {
    if (!postId || !user?._id) {
      console.error("Invalid like action:", { postId, user });
      return;
    }

    try {
      console.log("Sending like request:", { postId, userId: user._id });
      const response = await api.patch(`/posts/${postId}/like`);
      console.log("Like response:", response.data);

      // Update local state with response
      if (response.data.success) {
        updateLikesInPosts(postId, response.data.likes);
      }
    } catch (err) {
      console.error("Failed to like post:", err);
      toast.error(
        err.response?.data?.message || "Failed to like post. Please try again."
      );
    }
  };

  const handleReshare = async (postId) => {
    if (!postId || !user?._id) {
      console.error("Invalid reshare action:", { postId, user });
      return;
    }

    try {
      await api.post(`/posts/${postId}/reshare`);
      toast.success("Post reshared!");
    } catch (err) {
      console.error("Failed to reshare post:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to reshare post. Please try again."
      );
    }
  };

  const handleDelete = async (postId) => {
    if (!postId || !user?._id) {
      console.error("Invalid delete action:", { postId, user });
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);
      toast.success("Post deleted");
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to delete post. Please try again."
      );
    }
  };

  // Enhanced search functionality
  const handleSearch = (query) => {
    const searchText = typeof query === "string" ? query : "";
    setSearchQuery(searchText);

    if (!searchText.trim()) {
      setFilteredPosts(posts);
      return;
    }

    try {
      const fuse = new Fuse(posts, {
        threshold: 0.3,
        keys: ["content", "author.name"],
        minMatchCharLength: 2,
      });
      const results = fuse.search(searchText);
      const matchedPosts = results.map((r) => r.item).filter(Boolean);
      setFilteredPosts(matchedPosts);
    } catch (err) {
      console.error("Search error:", err);
      setFilteredPosts(posts);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredPosts(posts);
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  // Enhanced loading skeletons
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

  // Enhanced empty state
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-12"
    >
      <div className="text-gray-500 dark:text-gray-400">
        {searchQuery ? (
          <>
            <p className="text-lg">No posts match your search</p>
            <button
              onClick={clearSearch}
              className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear search
            </button>
          </>
        ) : (
          <p className="text-lg">
            No posts available yet. Be the first to post!
          </p>
        )}
      </div>
    </motion.div>
  );

  // Enhanced post rendering
  const renderPosts = () => (
    <div className="space-y-6">
      {filteredPosts.map((post) => {
        if (!validatePost(post)) {
          console.warn("Invalid post skipped in rendering:", post);
          return null;
        }

        return (
          <motion.div
            key={post?._id}
            ref={(el) => {
              if (el && post?._id) {
                postRefs.current[post?._id] = el;
              }
            }}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <PostCard
              post={post}
              user={user}
              commentText={commentText[post?._id] || ""}
              onCommentChange={(text) => handleCommentChange(post?._id, text)}
              onAddComment={() => handleAddComment(post?._id)}
              onLike={() => handleLike(post?._id)}
              onReshare={() => handleReshare(post?._id)}
              onDelete={() => handleDelete(post?._id)}
              searchQuery={searchQuery}
            />
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 px-4 pb-6 max-w-3xl mx-auto">
      {/* Modern Search Bar */}
      <motion.div layout className={`relative ${searchFocused ? "z-10" : ""}`}>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search posts..."
            className="w-full pl-10 pr-8 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && renderLoadingSkeletons()}

      {/* Posts List */}
      <AnimatePresence mode="wait">
        {!loading &&
          (filteredPosts.length === 0 ? renderEmptyState() : renderPosts())}
      </AnimatePresence>
    </div>
  );
}
