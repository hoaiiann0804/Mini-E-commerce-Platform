import axios from "axios";
import { getValidToken } from "@/utils/tokenManager";
import { handleUnauthorizedError } from "@/utils/authUtils";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8888/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error in development
    if (import.meta.env.DEV) {
      console.group("🚨 API Client Error");
      //console.log("URL:", error.config?.url);
      //console.log("Status:", error.response?.status);
      //console.log("Data:", error.response?.data);
      console.groupEnd();
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      handleUnauthorizedError({
        status: 401,
        data: error.response.data,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
