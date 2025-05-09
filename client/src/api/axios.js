import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  // withCredentials: true, // ✅ needed for cookies
});

// Automatically attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
