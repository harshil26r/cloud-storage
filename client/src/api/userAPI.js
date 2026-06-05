import axiosInstance from "./axiosInstance";

// userentication API endpoints
// User login
export const login = async (email, password) => {
  try {
    const { data, statusText } = await axiosInstance.post("/user/login", {
      email,
      password,
    });
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Login failed";
    throw new Error(errorMessage);
  }
};

// User signup
export const signup = async (userData) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/user/signup",
      userData,
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Signup failed";
    throw new Error(errorMessage);
  }
};

// User logout
export const logout = async () => {
  try {
    const { data, statusText } = await axiosInstance.post("/user/logout");
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Logout failed";
    throw new Error(errorMessage);
  }
};

// Logout from all sessions
export const logoutAll = async () => {
  try {
    const { data, statusText } = await axiosInstance.post("/user/logoutAll");
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Logout failed";
    throw new Error(errorMessage);
  }
};

// Get current user profile
export const getProfile = async () => {
  try {
    const { data, statusText } = await axiosInstance.get("/user/user");
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to get profile";
    throw new Error(errorMessage);
  }
};

// Update user profile
export const updateProfile = async (userData) => {
  try {
    const { data, statusText } = await axiosInstance.put(
      "/user/user",
      userData,
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to update profile";
    throw new Error(errorMessage);
  }
};

// Change password
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/user/change-password",
      {
        oldPassword,
        newPassword,
      },
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to change password";
    throw new Error(errorMessage);
  }
};

// Refresh token
export const refreshToken = async () => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/user/refresh-token",
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to refresh token";
    throw new Error(errorMessage);
  }
};
