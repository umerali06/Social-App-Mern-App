/* eslint-disable no-unused-vars */
import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export default function SidebarOnlineUsers() {
  const { onlineUsers, userMap } = useSocket();
  const uniqueOnlineUsers = [...new Set(onlineUsers)];

  return (
    <aside className="hidden lg:block w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 shadow-inner sticky top-0 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        👥 Online Users
      </h3>
      <ul className="space-y-3">
        <AnimatePresence>
          {uniqueOnlineUsers.map((id) => {
            const name = userMap[id] || "User";
            return (
              <motion.li
                key={id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow">
                    {name[0]}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                </div>
                <span
                  className="text-sm text-gray-800 dark:text-gray-200 truncate"
                  title={name}
                >
                  {name}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </aside>
  );
}
