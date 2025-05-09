/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { toast } from "sonner";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userMap, setUserMap] = useState({});
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user || !user._id) return;

    const s = io("http://localhost:5000", {
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true, // Enable reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);
    s.emit("join", { userId: user._id, name: user.name });

    s.on("onlineUsers", ({ users }) => {
      const ids = users.map((u) => u._id);
      const map = Object.fromEntries(users.map((u) => [u._id, u.name]));
      setOnlineUsers(ids);
      setUserMap(map);
    });

    s.on("userJoined", ({ name }) => toast.success(`🟢 ${name} is online`));
    s.on("userLeft", ({ name }) => toast(`🔌 ${name} went offline`));

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, userMap }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
