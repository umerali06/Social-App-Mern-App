/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-useless-catch */
import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/users/profile")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signup = async (name, email, password) => {
    try {
      const res = await api.post("/auth/signup", { name, email, password });
      const { user, token } = res.data;
      localStorage.setItem("accessToken", token);
      setUser(user);
    } catch (err) {
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, token } = res.data;
      localStorage.setItem("accessToken", token);
      setUser(user);
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    await api.get("/auth/logout");
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, signup, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Add this to fix your import
export const useAuth = () => useContext(AuthContext);
