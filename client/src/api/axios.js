import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Update this to your production URL when deploying
  withCredentials: true, // Ensures cookies are sent with each request
});

// Attach token from HTTP-only cookie (instead of localStorage)
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="));
  if (token) {
    config.headers.Authorization = `Bearer ${token.split("=")[1]}`; // Extract token from cookie
  }
  return config;
});

// Error handling: Redirect to login page if token is invalid or expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = "/signin"; // Redirect to login page if token is expired or invalid
    }
    return Promise.reject(error);
  }
);

export default api;
