import { useEffect, useState, useContext } from "react";
import { useSocket } from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function SidebarMessageUsers({ onUserSelect }) {
  const [users, setUsers] = useState([]);
  const { onlineUsers, userMap } = useSocket();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    api
      .get("/users")
      .then((res) => setUsers(res.data.filter((u) => u._id !== user._id))) // exclude self
      .catch((err) => console.error("Failed to load users", err));
  }, [user]);

  const isOnline = (id) => onlineUsers.includes(id);

  const handleUserSelect = (user) => {
    // First trigger the parent callback (if any)
    onUserSelect(user);
    // Then update the URL
    navigate(`/chat/${user._id}`); // Update the URL to reflect the selected user
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        💬 Message Users
      </h3>
      <ul className="space-y-3">
        {users.map((u) => (
          <motion.li
            key={u._id}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => handleUserSelect(u)} // Now this triggers URL change
          >
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow ${
                  isOnline(u._id)
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {u.name?.[0] || "U"}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                  isOnline(u._id) ? "bg-green-500" : "bg-gray-400"
                } border-white dark:border-gray-900`}
              />
            </div>
            <span
              className="text-sm text-gray-800 dark:text-gray-200 truncate"
              title={u.name}
            >
              {u.name}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
