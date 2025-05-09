/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSocket } from "./SocketContext";
import { toast } from "sonner";
import notificationSound from "/notification.mp3";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);

  const activeChatIdRef = useRef(null);
  activeChatIdRef.current = activeChatId;

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

  const markAsRead = (notifId) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
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
