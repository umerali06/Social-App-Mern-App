// pages/ChatPage.jsx
import { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindowFull from "@/components/ChatWindowFull";

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <ChatSidebar onSelectUser={setSelectedUser} selectedUser={selectedUser} />

      {/* Right Panel */}
      <div className="flex-1">
        {selectedUser ? (
          <ChatWindowFull user={selectedUser} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-300">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
