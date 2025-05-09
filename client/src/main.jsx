/* eslint-disable no-undef */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatUIProvider } from "./context/ChatUIContext";

const container = document.getElementById("root");

// 2. Create a root
const root = ReactDOM.createRoot(container);

const clientId = import.meta.env.REACT_APP_GOOGLE_CLIENT_ID;

// Create a wrapper that uses ThemeContext to apply dark mode

root.render(
  <GoogleOAuthProvider clientId={clientId}>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatUIProvider>
              <App />
            </ChatUIProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
  // document.getElementById("root")
);
