/* eslint-disable react-hooks/rules-of-hooks */
import { useNotifications } from "../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function NotificationSidebar({ onClose }) {
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();

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
      onClose?.();

      if (notif.type === "message") {
        if (!notif.sender?._id) {
          console.error("Invalid sender ID for message notification");
          return;
        }
        localStorage.setItem("openChatWith", notif.sender._id);
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

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 p-5 overflow-y-auto border-l border-gray-200 dark:border-gray-700 transition-all">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-white">
          🔔 Notifications
        </h2>
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-700 transition-colors text-sm font-medium flex items-center gap-1"
        >
          <X size={18} /> Close
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No new notifications.
        </p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li key={notif._id}>
              <div
                onClick={() => handleNotificationClick(notif)}
                className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {notif.type === "message" ? (
                    <>💬 New message from {notif.sender.name}</>
                  ) : (
                    <>
                      {notif.sender.name}{" "}
                      <span className="capitalize">{notif.type}</span>ed your
                      post
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
