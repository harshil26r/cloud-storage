import axiosInstance from "./axiosInstance";

// userentication API endpoints
// User login
export const login = async (email, password) => {
  const { data, statusText } = await axiosInstance.post("/user/login", {
    email,
    password,
  });
  return { data, statusText };
};

// User signup
export const signup = async (userData) => {
  const { data, statusText } = await axiosInstance.post(
    "/user/signup",
    userData,
  );
  return { data, statusText };
};

// User logout
export const logout = async () => {
  const { data, statusText } = await axiosInstance.post("/user/logout");
  return { data, statusText };
};

// Logout from all sessions
export const logoutAll = async () => {
  const { data, statusText } = await axiosInstance.post("/user/logoutAll");
  return { data, statusText };
};

// Get current user profile
export const getProfile = async () => {
  const { data, statusText } = await axiosInstance.get("/user/user");
  return { data, statusText };
};

// Update user profile
export const updateProfile = async (userData) => {
  const { data, statusText } = await axiosInstance.put("/user/user", userData);
  return { data, statusText };
};

// Change password
export const changePassword = async (oldPassword, newPassword) => {
  const { data, statusText } = await axiosInstance.post(
    "/user/change-password",
    {
      oldPassword,
      newPassword,
    },
  );
  return { data, statusText };
};

// Refresh token
export const refreshToken = async () => {
  const { data, statusText } = await axiosInstance.post("/user/refresh-token");
  return { data, statusText };
};

// Send OTP
export const sendOtp = async (email) => {
  const { data, statusText } = await axiosInstance.post("/auth/send-otp", {
    email,
  });
  return { data, statusText };
};

// Verify OTP
export const verifyOtp = async (email, otp) => {
  const { data, statusText } = await axiosInstance.post("/auth/verify-otp", {
    email,
    otp,
  });
  return { data, statusText };
};
