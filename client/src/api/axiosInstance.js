import axios from "axios";
import { router } from "../router";
import { showErrorToast } from "../utils/toastConfig";

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

// // Request interceptor
// axiosInstance.interceptors.request.use(
//   (config) => {
//     // Add any auth tokens or headers if needed
//     // const token = localStorage.getItem("authToken");
//     // if (token) {
//     //   config.headers.Authorization = `Bearer ${token}`;
//     // }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes("/user/login") ||
        error.config?.url?.includes("/user/signup");
      const isAuthPage =
        window.location.pathname.includes("/login") ||
        window.location.pathname.includes("/signup");

      if (!isAuthEndpoint && !isAuthPage) {
        // Retrieve error message from response data if available
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Session expired. Please log in again.";
        showErrorToast(errorMessage);
        router.navigate("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
