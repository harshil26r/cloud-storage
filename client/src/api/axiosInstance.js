import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable cookies
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any auth tokens or headers if needed
    // const token = localStorage.getItem("authToken");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      if (status === 401) {
        // Unauthorized - handle logout
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      } else if (status === 403) {
        // Forbidden
        console.error("Access forbidden");
      } else if (status === 404) {
        // Not found
        console.error("Resource not found");
      } else if (status === 500) {
        // Server error
        console.error("Server error");
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("No response from server");
    } else {
      // Error in request setup
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
