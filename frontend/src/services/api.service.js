import axios from "axios";

const API_URL = "debug-race-production-b38c.up.railway.app"; // Change this to your backend URL

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",,
  timeout: 10000,
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
