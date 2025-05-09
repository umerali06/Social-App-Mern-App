import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/api/axios"; // ✅ Axios is restored for fetching chat history

export default function useChatEngine({
  socket,
  currentUser,
  selectedUser,
  onSidebarUpdate = () => {},
}) {
  const [messages, setMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);

  // ✅ Fetch messages when chat window opens or selected user changes
  useEffect(() => {
    if (!selectedUser?._id || !currentUser?._id) return;

    setMessages([]); // Clear old messages on user switch

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);

        await api.patch(`/messages/read/${selectedUser._id}`);
      } catch (err) {
        console.error("❌ Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [selectedUser?._id, currentUser?._id]);

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Notification sound
  const playSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  // ✅ Handle received message
  const handleReceive = useCallback(
    (msg) => {
      const isCurrentChat =
        msg.sender === selectedUser?._id || msg.receiver === selectedUser._id;

      if (isCurrentChat) {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m._id === msg._id);
          if (alreadyExists) return prev;
          playSound();
          return [...prev, msg];
        });
      } else {
        onSidebarUpdate(msg);
      }
    },
    [selectedUser?._id, onSidebarUpdate]
  );

  const handleTyping = useCallback(
    ({ from }) => {
      if (from === selectedUser?._id) setPartnerTyping(true);
    },
    [selectedUser?._id]
  );

  const handleStopTyping = useCallback(
    ({ from }) => {
      if (from === selectedUser?._id) setPartnerTyping(false);
    },
    [selectedUser?._id]
  );

  const handleSidebarUpdate = useCallback(
    (data) => {
      onSidebarUpdate(data);
    },
    [onSidebarUpdate]
  );

  // ✅ Register socket listeners only once per chat
  useEffect(() => {
    if (!socket || !selectedUser || !currentUser) return;

    socket.on("receiveMessage", handleReceive);
    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);
    socket.on("chatUpdate", handleSidebarUpdate);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
      socket.off("chatUpdate", handleSidebarUpdate);
    };
  }, [
    socket,
    selectedUser?._id,
    currentUser?._id,
    handleReceive,
    handleTyping,
    handleStopTyping,
    handleSidebarUpdate,
  ]);

  // ✅ Send message via socket (no Axios)
  const sendMessage = (content, isImage = false) => {
    if (!content.trim() || !selectedUser?._id || !currentUser?._id) return;

    const newMsg = {
      sender: currentUser._id,
      receiver: selectedUser._id,
      content: content.trim(),
      isImage,
    };

    if (socket?.connected) {
      socket.emit("sendMessage", {
        ...newMsg,
        senderName: currentUser.name,
      });
    }
  };

  // ✅ Typing input handler with debounce
  const handleTypingInput = (e, setInput) => {
    setInput(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("userTyping", {
        to: selectedUser._id,
        from: currentUser._id,
      });
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("userStopTyping", {
        to: selectedUser._id,
        from: currentUser._id,
      });
    }, 1200);
  };

  return {
    messages,
    sendMessage,
    handleTyping: handleTypingInput,
    partnerTyping,
    scrollRef,
  };
}
