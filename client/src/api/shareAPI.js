import axiosInstance from "./axiosInstance";

// Search users by email or username
export const searchUsers = async (query, options = {}) => {
  const { data } = await axiosInstance.get(`/user/search`, {
    params: { query },
    signal: options.signal,
  });
  return data;
};

// Get share settings for a file or directory
export const getShareSettings = async (itemId, isFile) => {
  const type = isFile ? "file" : "directory";
  const { data } = await axiosInstance.get(`/${type}/${itemId}/share`);
  return data;
};

// Update share settings for a file or directory
export const updateShareSettings = async (itemId, isFile, shareData) => {
  const type = isFile ? "file" : "directory";
  const { data } = await axiosInstance.post(`/${type}/${itemId}/share`, shareData);
  return data;
};

// Get files and folders shared with the current user
export const getSharedWithMe = async () => {
  const { data } = await axiosInstance.get(`/directory/shared-with-me`);
  return data;
};
