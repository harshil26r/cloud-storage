import toast from "react-hot-toast";

const toastStyles = {
  success: {
    style: {
      border: "1px solid #10b981",
      padding: "16px",
      color: "#065f46",
      backgroundColor: "#f0fdf4",
    },
    iconTheme: {
      primary: "#10b981",
      secondary: "#f0fdf4",
    },
  },
  error: {
    style: {
      border: "1px solid #ef4444",
      padding: "16px",
      color: "#7f1d1d",
      backgroundColor: "#fef2f2",
    },
    iconTheme: {
      primary: "#ef4444",
      secondary: "#fef2f2",
    },
  },
};

export const showSuccessToast = (message, toastId) => {
  toast.success(message, toastId ? { id: toastId, ...toastStyles.success } : toastStyles.success);
};

export const showErrorToast = (message, toastId) => {
  toast.error(message, toastId ? { id: toastId, ...toastStyles.error } : toastStyles.error);
};

export const showLoadingToast = (message, toastId) => {
  return toast.loading(message, toastId ? { id: toastId } : undefined);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};
