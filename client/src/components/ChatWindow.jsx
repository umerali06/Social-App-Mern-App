import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useNotifications } from "@/context/NotificationContext";
import { ImageIcon, Smile, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import api from "@/api/axios";
import useChatEngine from "./chat/ChatEngine";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useMediaQuery } from "react-responsive";

export default function ChatWindow({ user }) {
  const { user: currentUser } = useContext(AuthContext);
  const { socket } = useSocket();
  const { setActiveChatId } = useNotifications();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState("");
  const fileRef = useRef();

  if (!user?._id) return null;

  useEffect(() => {
    setActiveChatId(user._id);
    return () => setActiveChatId(null);
  }, [user._id, setActiveChatId]);

  const { messages, sendMessage, partnerTyping, scrollRef } = useChatEngine({
    socket,
    currentUser,
    selectedUser: user,
  });

  const validateImage = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB max size

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please select an image (JPEG, PNG, GIF).");
      return false;
    }
    if (file.size > maxSize) {
      alert("File size exceeds 5MB. Please select a smaller image.");
      return false;
    }
    return true;
  };

  const isImageUrl = (str) => {
    if (!str) return false;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const lowerCaseStr = str.toLowerCase();
    return (
      imageExtensions.some((ext) => lowerCaseStr.endsWith(ext)) ||
      lowerCaseStr.includes("/image/") ||
      lowerCaseStr.includes("cloudinary") ||
      (lowerCaseStr.includes("http") &&
        imageExtensions.some((ext) => lowerCaseStr.includes(ext)))
    );
  };

  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateImage(file)) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("receiver", user._id);

    try {
      const res = await api.post("/messages/image", formData);
      const message = {
        sender: currentUser._id,
        receiver: user._id,
        content: res.data.imageUrl,
        isImage: true,
        senderName: currentUser.name,
      };
      socket.emit("sendMessage", message);
    } catch (err) {
      console.error("Image upload failed", err);
    }

    setUploading(false);
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    if (!Array.isArray(messages)) return {};

    return messages.reduce((acc, message) => {
      const date = new Date(message.createdAt);
      const dateKey = format(date, "yyyy-MM-dd");

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(message);
      return acc;
    }, {});
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <motion.div
      className="flex flex-col h-full bg-gray-50 dark:bg-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                {format(new Date(date), "MMMM d, yyyy")}
              </div>
            </div>

            {dateMessages.map((msg, idx) => {
              const senderId =
                typeof msg.sender === "object" ? msg.sender._id : msg.sender;
              const isSender = senderId === currentUser._id;
              const isImage = msg.isImage || isImageUrl(msg.content);
              const showAvatar =
                idx === 0 || dateMessages[idx - 1].sender !== msg.sender;

              return (
                <motion.div
                  key={idx}
                  className={`flex ${isSender ? "justify-end" : "justify-start"} items-end space-x-2`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {!isSender && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl ${isSender ? "ml-10" : "mr-10"}`}
                  >
                    <div
                      className={`relative px-4 py-2 rounded-2xl text-sm ${
                        isSender
                          ? "bg-indigo-500 text-white rounded-br-none"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"
                      }`}
                    >
                      {isImage ? (
                        <motion.div
                          className="rounded-lg overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        >
                          <img
                            src={msg.content}
                            alt="Sent Image"
                            className="max-h-64 w-auto rounded-lg"
                            onError={(e) => {
                              console.log("Failed to load image:", msg.content);
                              e.target.onerror = null;
                              e.target.src = "";
                              e.target.alt = "Image failed to load";
                            }}
                          />
                        </motion.div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {isSender && (
                        <div className="flex justify-end items-center mt-1 space-x-1">
                          <span className="text-[10px] text-white/80">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                          <span className="text-[10px]">
                            {msg.read ? "✓✓" : "✓"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {partnerTyping && (
          <motion.div
            className="flex items-center space-x-2 px-4 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </motion.div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              className="absolute bottom-16 right-4 z-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <EmojiPicker
                onEmojiClick={(emoji) => setText((prev) => prev + emoji.emoji)}
                theme={
                  window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                }
                width={isMobile ? "100%" : 350}
                height={400}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileRef.current.click()}
            className="p-2 text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            disabled={uploading}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={sendImage}
            className="hidden"
          />

          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  sendMessage(text);
                  setText("");
                  setShowEmoji(false);
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-12"
            />
            {text && (
              <button
                onClick={() => {
                  sendMessage(text);
                  setText("");
                  setShowEmoji(false);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
