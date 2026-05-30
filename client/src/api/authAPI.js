import axiosInstance from "./axiosInstance";

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

// Verify OTP
export const verifyGoogleToken = async (tokenId) => {
  const { data, statusText } = await axiosInstance.post("/auth/google-login", {
    tokenId,
  });
  return { data, statusText };
};
