/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSocket } from "./SocketContext";
import { toast } from "sonner";
import notificationSound from "/notification.mp3";
import api from "../api/axios";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);

  const activeChatIdRef = useRef(null);
  activeChatIdRef.current = activeChatId;

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n) => !n.read).length);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      console.log("🔔 Received newNotification:", notif);
      const isMessage = notif.type === "message";

      // 🛑 Avoid notification if already chatting with the sender
      if (isMessage && notif.sender._id === activeChatIdRef.current) return;

      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      const audio = new Audio(notificationSound);
      audio.volume = 0.7;
      audio.play().catch((err) => {
        console.warn("🔇 Notification sound error:", err.message);
      });

      toast(
        isMessage
          ? `💬 New message from ${notif.sender.name}`
          : `${notif.sender.name} ${notif.type}ed your post`,
        {
          description: new Date(notif.createdAt).toLocaleTimeString(),
        }
      );
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket]); // ✅ Now stable, won't rebind on activeChatId change

  const markAsRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        setNotifications,
        activeChatId,
        setActiveChatId,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
