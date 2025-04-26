import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";

// 1. Grab the root DOM node
const container = document.getElementById("root");

// 2. Create a root
const root = ReactDOM.createRoot(container);

// 3. Render your app
root.render(
  <GoogleOAuthProvider clientId="542040653986-283jp94etdhkt4ve2giq9p51il47n093.apps.googleusercontent.com">
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
);
