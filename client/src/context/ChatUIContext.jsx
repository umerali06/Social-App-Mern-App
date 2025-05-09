// context/ChatUIContext.js
import { createContext, useContext, useState } from "react";

const ChatUIContext = createContext();
export const useChatUI = () => useContext(ChatUIContext);

export const ChatUIProvider = ({ children }) => {
  const [popupUser, setPopupUser] = useState(null); // User for popup
  const [isFullscreenChat, setIsFullscreenChat] = useState(false); // true when /chat/:id route

  return (
    <ChatUIContext.Provider
      value={{
        popupUser,
        setPopupUser,
        isFullscreenChat,
        setIsFullscreenChat,
      }}
    >
      {children}
    </ChatUIContext.Provider>
  );
};
