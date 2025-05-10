import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

import {
  FiSettings,
  FiUser,
  FiBell,
  FiHome,
  FiBookmark,
  FiMessageCircle,
  FiFileText,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { X } from "lucide-react";
import FeedLayout from "../components/FeedLayout";
import SavedPosts from "../components/SavedPosts";
import MyPosts from "../components/MyPosts";
import ChatLayout from "../components/ChatLayout";
import ProfileView from "./Profile";

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, markAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [showNotifications, setShowNotifications] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Tabs configuration
  const tabs = [
    {
      id: "home",
      icon: <FiHome className="inline mr-2" />,
      label: "Home",
      component: <FeedLayout />,
    },
    {
      id: "my-posts",
      icon: <FiFileText className="inline mr-2" />,
      label: "My Posts",
      component: <MyPosts />,
    },
    {
      id: "saved",
      icon: <FiBookmark className="inline mr-2" />,
      label: "Saved",
      component: <SavedPosts />,
    },
    {
      id: "profile",
      icon: <FiUser className="inline mr-2" />,
      label: "Profile",
      component: (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ProfileView />
        </div>
      ),
    },
    {
      id: "messages",
      icon: <FiMessageCircle className="inline mr-2" />,
      label: "Messages",
      component: <ChatLayout />,
    },
  ];

  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab);
      // clear it out so it doesn't fire again if the user clicks other tabs
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleNotificationClick = async (notif) => {
    console.log("Notification clicked:", {
      type: notif.type,
      post: notif.post,
      postId: notif.post?._id,
      sender: notif.sender,
      fullNotification: notif,
    });

    if (!notif) {
      console.error("Invalid notification object");
      return;
    }

    try {
      await markAsRead(notif._id);
      setShowNotifications(false);

      if (notif.type === "message") {
        if (!notif.sender?._id) {
          console.error("Invalid sender ID for message notification");
          return;
        }
        navigate(`/chat/${notif.sender._id}`);
      } else {
        // For post-related notifications (like, comment, reshare)
        const postId = notif.post?._id;
        if (!postId) {
          console.error("No post ID found in notification:", notif);
          return;
        }
        console.log("Navigating to post:", postId);
        navigate(`/post/${postId}`);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  if (!user) return <Navigate to="/signin" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* User Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
              <p className="text-gray-500 dark:text-gray-400">
                @{user?.username || "user"}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiBell size={20} />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiSettings size={20} />
            </button>
          </div>
        </motion.div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed right-4 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                  No new notifications
                </p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notif) => (
                    <li key={notif._id}>
                      <div
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          !notif.read ? "bg-blue-50 dark:bg-gray-700" : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            {notif.type === "message" ? (
                              <span className="text-blue-500">💬</span>
                            ) : (
                              <span className="text-yellow-500">👍</span>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notif.sender.name}{" "}
                              {notif.type === "message"
                                ? "sent you a message"
                                : `${notif.type}d your post`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-shrink-0 px-4 py-2 font-medium relative ${activeTab === tab.id ? "text-blue-500 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 dark:bg-blue-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </motion.div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-3">
            {tabs.slice(0, 4).map((tab) => (
              <button
                key={tab.id}
                className={`p-2 ${activeTab === tab.id ? "text-blue-500" : "text-gray-500"}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
              >
                {React.cloneElement(tab.icon, { size: 24 })}
              </button>
            ))}
            <button
              className="p-2 text-gray-500"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <div className="relative">
                <FiBell size={24} />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
