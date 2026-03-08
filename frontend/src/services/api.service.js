import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://debug-race-production-5710.up.railway.app"; // Update this to your server URL must add https://

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("debugrace_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    console.error("📤 API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error("📥 API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
