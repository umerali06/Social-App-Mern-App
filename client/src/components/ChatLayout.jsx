import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/axios";
import ChatWindow from "./ChatWindow";
import ChatHeader from "./ChatHeader";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiChevronLeft } from "react-icons/fi";
import { useMediaQuery } from "react-responsive";

const isImageUrl = (str) => {
  if (!str) return false;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const lowerCaseStr = String(str).toLowerCase();
  return (
    imageExtensions.some((ext) => lowerCaseStr.endsWith(ext)) ||
    lowerCaseStr.includes("/image/") ||
    lowerCaseStr.includes("cloudinary") ||
    (lowerCaseStr.includes("http") &&
      imageExtensions.some((ext) => lowerCaseStr.includes(ext)))
  );
};

export default function ChatLayout({ initialUser = null }) {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(initialUser);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [recentMessages, setRecentMessages] = useState(() => {
    const storedMessages = localStorage.getItem("recentMessages");
    return storedMessages ? JSON.parse(storedMessages) : {};
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    socket.on("onlineUsers", ({ users }) => setOnlineUsers(users));
    socket.emit("join", { userId: currentUser._id, name: currentUser.name });

    socket.on("receiveMessage", (message) => {
      setRecentMessages((prevMessages) => {
        let contentToStore = message.content;
        if (message.isImage || isImageUrl(message.content)) {
          contentToStore = "[IMAGE]";
        }
        const updatedMessages = {
          ...prevMessages,
          [message.sender]: contentToStore,
          [message.receiver]: contentToStore,
        };
        localStorage.setItem("recentMessages", JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("receiveMessage");
    };
  }, [socket, currentUser]);

  const isOnline = (userId) => {
    if (!onlineUsers || !userId) return false;
    return onlineUsers.some((u) => u?._id === userId);
  };

  const filteredUsers = users.filter((u) =>
    u?.name?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (userId && users.length > 0) {
      const user = users.find((u) => u?._id === userId);
      if (user) {
        setSelectedUser(user);
        if (isMobile) setShowSidebar(false);
      }
    }
  }, [userId, users, isMobile]);

  const handleUserSelect = (user) => {
    if (!user?._id) return;
    setSelectedUser(user);
    navigate(`/chat/${user._id}`);
    if (isMobile) setShowSidebar(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar - Desktop always visible, mobile toggle */}
      <AnimatePresence>
        {(showSidebar || !isMobile) && (
          <motion.div
            className={`w-full md:w-80 flex flex-col border-r border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 z-10 absolute md:relative h-full`}
            initial={{ x: isMobile ? -320 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? -320 : 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Messages</h2>
                {!isMobile && currentUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="relative mt-3">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-none text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <motion.li
                      key={user?._id || Math.random()}
                      onClick={() => handleUserSelect(user)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        selectedUser?._id === user?._id
                          ? "bg-indigo-50 dark:bg-gray-800"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          {isOnline(user?._id) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium truncate">
                              {user?.name || "Unknown User"}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {recentMessages[user?._id] === "[IMAGE]"
                                ? "📷"
                                : ""}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {recentMessages[user?._id]
                              ? recentMessages[user?._id] === "[IMAGE]"
                                ? "Image"
                                : recentMessages[user?._id]
                              : "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-gray-800 ${!selectedUser && "hidden md:flex"}`}
      >
        {selectedUser ? (
          <>
            <ChatHeader
              user={selectedUser}
              isOnline={isOnline(selectedUser._id)}
              onBack={() => {
                if (isMobile) {
                  setShowSidebar(true);
                  navigate("/chat");
                }
              }}
            />
            <div className="flex-1 overflow-hidden">
              <ChatWindow user={selectedUser} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-indigo-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-indigo-500 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Choose an existing chat or start a new conversation to begin
              messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
