import React, { useState } from "react"; // Added React import
import { useSocket } from "../context/SocketContext";
import { ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { FiSearch, FiChevronLeft } from "react-icons/fi";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";

export default function ChatSidebar({
  allUsers = [],
  selectedUser,
  setSelectedUser,
  recentMessages = {},
  onlineUsers = [],
  loading = false,
  error = null,
  onRefresh = () => window.location.reload(),
}) {
  const [search, setSearch] = useState("");
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const navigate = useNavigate();

  const filteredUsers = allUsers.filter((user) =>
    user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleBack = () => {
    if (isMobile) {
      navigate("/chats");
    } else {
      navigate(-1);
    }
  };

  const handleUserSelect = (user) => {
    if (!user?._id) return;
    setSelectedUser(user);
    if (isMobile) {
      // Optional: Close sidebar on mobile after selection
      document.querySelector(".chat-sidebar")?.classList.add("hidden");
    }
  };

  return (
    <motion.div
      className={`chat-sidebar bg-white dark:bg-gray-900 h-full flex flex-col ${
        isMobile ? "w-full absolute z-10" : "w-80 border-r"
      }`}
      initial={{ x: isMobile ? -300 : 0 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {isMobile && (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              aria-label="Back"
            >
              <FiChevronLeft size={20} />
            </button>
          )}
          <h2 className="text-xl font-bold dark:text-white">Chats</h2>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {allUsers.length === 0
                ? "No users available"
                : "No matches found"}
            </p>
            <button
              onClick={onRefresh}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {filteredUsers.map((user) => (
              <motion.li
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedUser?._id === user._id
                      ? "bg-blue-100 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {onlineUsers.some((u) => u._id === user._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {recentMessages[user._id] === "[IMAGE]"
                        ? "📷 Image"
                        : recentMessages[user._id] || "No messages"}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer - Desktop Back Button */}
      {!isMobile && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleBack}
            className="w-full py-2 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <FiChevronLeft /> Back
          </button>
        </div>
      )}
    </motion.div>
  );
}
