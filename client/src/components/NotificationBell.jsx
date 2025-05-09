import { useNotifications } from "../context/NotificationContext";
import { Bell } from "lucide-react";

export default function NotificationBell({ onClick }) {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <Bell className="text-gray-600 dark:text-white" size={24} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
