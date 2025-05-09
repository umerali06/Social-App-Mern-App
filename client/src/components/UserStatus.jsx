import { useSocket } from "../context/SocketContext";

export default function UserStatus({
  userId,
  name,
  avatarUrl,
  size = "sm",
  hideNameOnMobile = false,
  dangerouslyRenderName = false,
}) {
  const { onlineUsers } = useSocket();
  const isOnline = onlineUsers.includes(userId);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <img
          src={
            avatarUrl || `https://ui-avatars.com/api/?name=${name || "User"}`
          }
          alt="User Avatar"
          className={`${sizeClasses[size]} rounded-full border-2 border-indigo-500 shadow-md transition-transform duration-200 hover:scale-105`}
        />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-300 ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </div>

      {/* Username display */}
      {!hideNameOnMobile ? (
        dangerouslyRenderName ? (
          <span
            className="text-sm font-medium text-gray-800 dark:text-white truncate hover:text-indigo-600 transition-colors duration-200"
            dangerouslySetInnerHTML={{ __html: name || "Unknown" }}
          />
        ) : (
          <span className="text-sm font-medium text-gray-800 dark:text-white truncate hover:text-indigo-600 transition-colors duration-200">
            {name || "Unknown"}
          </span>
        )
      ) : (
        <span className="text-sm font-medium text-gray-800 dark:text-white truncate hidden sm:inline">
          {name || "Unknown"}
        </span>
      )}
    </div>
  );
}
