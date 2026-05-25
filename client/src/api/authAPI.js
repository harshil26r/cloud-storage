import axiosInstance from "./axiosInstance";

// Authentication API endpoints
// User login
export const login = async (email, password) => {
  const { data, statusText } = await axiosInstance.post("/auth/login", {
    email,
    password,
  });
  return { data, statusText };
};

// User signup
export const signup = async (userData) => {
  const { data, statusText } = await axiosInstance.post(
    "/auth/signup",
    userData,
  );
  return { data, statusText };
};

// User logout
export const logout = async () => {
  const { data, statusText } = await axiosInstance.post("/auth/logout");
  return { data, statusText };
};

// Logout from all sessions
export const logoutAll = async () => {
  const { data, statusText } = await axiosInstance.post("/auth/logoutAll");
  return { data, statusText };
};

// Get current user profile
export const getProfile = async () => {
  const { data, statusText } = await axiosInstance.get("/auth/user");
  return { data, statusText };
};

// Update user profile
export const updateProfile = async (userData) => {
  const { data, statusText } = await axiosInstance.put("/auth/user", userData);
  return { data, statusText };
};

// Change password
export const changePassword = async (oldPassword, newPassword) => {
  const { data, statusText } = await axiosInstance.post(
    "/auth/change-password",
    {
      oldPassword,
      newPassword,
    },
  );
  return { data, statusText };
};

// Refresh token
export const refreshToken = async () => {
  const { data, statusText } = await axiosInstance.post("/auth/refresh-token");
  return { data, statusText };
};
