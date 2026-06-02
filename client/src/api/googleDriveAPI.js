import axiosInstance from "./axiosInstance";

// Connect Google Drive
export const connectGoogleDrive = async (code) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/auth/google-drive/connect",
      { code },
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to connect Google Drive";
    throw new Error(errorMessage);
  }
};

// Disconnect Google Drive
export const disconnectGoogleDrive = async () => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/auth/google-drive/disconnect",
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to disconnect Google Drive";
    throw new Error(errorMessage);
  }
};

// Initialize Google Drive storage
export const initializeGoogleDriveStorage = async (rootFolderName) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/google-drive/initialize",
      { rootFolderName },
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to initialize Google Drive storage";
    throw new Error(errorMessage);
  }
};

// Trigger Google Drive sync
export const syncGoogleDrive = async () => {
  try {
    const { data, statusText } = await axiosInstance.post("/google-drive/sync");
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to sync Google Drive";
    throw new Error(errorMessage);
  }
};

// Get sync status
export const getSyncStatus = async () => {
  try {
    const { data, statusText } = await axiosInstance.get(
      "/google-drive/sync-status",
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to get sync status";
    throw new Error(errorMessage);
  }
};

// Get Google Drive preferences
export const getGoogleDrivePreferences = async () => {
  try {
    const { data, statusText } = await axiosInstance.get(
      "/google-drive/preferences",
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to get preferences";
    throw new Error(errorMessage);
  }
};

// Update Google Drive preferences
export const updateGoogleDrivePreferences = async (preferences) => {
  try {
    const { data, statusText } = await axiosInstance.put(
      "/google-drive/preferences",
      preferences,
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to update preferences";
    throw new Error(errorMessage);
  }
};

// Make file offline (download)
export const makeFileOffline = async (fileId) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      `/google-drive/files/${fileId}/make-offline`,
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to download file";
    throw new Error(errorMessage);
  }
};

// Get file sync state
export const getFileSyncState = async (fileId) => {
  try {
    const { data, statusText } = await axiosInstance.get(
      `/google-drive/files/${fileId}/sync-state`,
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to get file state";
    throw new Error(errorMessage);
  }
};

// Stream Google file (online viewing)
export const streamGoogleFile = async (fileId) => {
  try {
    const response = await axiosInstance.get(
      `/google-drive/files/${fileId}/stream`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to stream file";
    throw new Error(errorMessage);
  }
};

// Upload file to Google Drive
export const uploadToGoogleDrive = async (formData) => {
  try {
    const { data, statusText } = await axiosInstance.post(
      "/google-drive/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to upload to Google Drive";
    throw new Error(errorMessage);
  }
};

// Delete Google Drive file
export const deleteGoogleFile = async (fileId, deleteLocal = false) => {
  try {
    const { data, statusText } = await axiosInstance.delete(
      `/google-drive/files/${fileId}`,
      { data: { deleteLocal } },
    );
    return { data, statusText, error: null };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to delete file";
    throw new Error(errorMessage);
  }
};
