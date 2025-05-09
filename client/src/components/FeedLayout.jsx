import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PostList from "./PostList";
import SidebarOnlineUsers from "./SidebarOnlineUsers";
import SidebarMessageUsers from "./SidebarMessageUsers";
import ChatLayout from "./ChatLayout";
import ErrorBoundary from "@/utils/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiMessageSquare, FiUsers, FiHome } from "react-icons/fi";
import { useMediaQuery } from "react-responsive";

export default function FeedLayout() {
  const [selectedUserForChat, setSelectedUserForChat] = useState(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10 gap-6 relative">
        {/* Main Content Area */}
        <main className="flex-1 space-y-6">
          {/* Header with Create Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center px-1"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
                Social Feed
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Connect with your community
              </p>
            </div>

            {/* Create Post Button */}
            <Link to="/create">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 mr-[10px]">
                <FiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Post</span>
              </Button>
            </Link>
          </motion.div>

          {/* Post List */}
          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <PostList />
            </motion.div>
          </ErrorBoundary>
        </main>

        {/* Sidebar - Desktop */}
        {!isMobile && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-72 shrink-0 space-y-6"
          >
            {/* Online Users Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <FiUsers className="w-5 h-5" />
                <h3 className="font-semibold">Online Now</h3>
              </div>
              <SidebarOnlineUsers />
            </div>

            {/* Message Users Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <FiMessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">Messages</h3>
              </div>
              <SidebarMessageUsers onUserSelect={setSelectedUserForChat} />
            </div>
          </motion.aside>
        )}

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-3 z-40">
            <button className="p-2 text-gray-700 dark:text-gray-300">
              <FiHome className="w-6 h-6" />
            </button>
            <button className="p-2 text-gray-700 dark:text-gray-300">
              <FiUsers className="w-6 h-6" />
            </button>
            <button className="p-2 text-gray-700 dark:text-gray-300">
              <FiMessageSquare className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {selectedUserForChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute inset-0 sm:inset-10 md:inset-20 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
            >
              <ChatLayout
                initialUser={selectedUserForChat}
                onClose={() => setSelectedUserForChat(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
