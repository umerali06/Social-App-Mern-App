import { motion } from "framer-motion";
import { FiChevronLeft, FiMoreVertical } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

export default function ChatHeader({ user, isOnline, onBack }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  if (!user) return null;

  return (
    <motion.div
      className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-3">
        {isMobile && (
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          )}
        </div>

        <div>
          <h2 className="font-semibold">{user.name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        <FiMoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
    </motion.div>
  );
}
