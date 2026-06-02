import axiosInstance from "./axiosInstance";

// Send OTP
export const sendOtp = async (email) => {
  try {
    const { data, statusText } = await axiosInstance.post("/auth/send-otp", {
      email,
    });
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to send OTP";
    throw new Error(errorMessage);
  }
};

// Verify OTP
export const verifyOtp = async (email, otp) => {
  try {
    const { data, statusText } = await axiosInstance.post("/auth/verify-otp", {
      email,
      otp,
    });
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to verify OTP";
    throw new Error(errorMessage);
  }
};

// Verify Google Token
export const verifyGoogleToken = async (tokenId) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/auth/google-login",
      {
        tokenId,
      },
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Google login failed";
    throw new Error(errorMessage);
  }
};

export const getGoogleDriveData = async (code) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/auth/google-drive",
      {
        code,
      },
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Google login failed";
    throw new Error(errorMessage);
  }
};
