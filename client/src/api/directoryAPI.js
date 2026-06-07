import axiosInstance from "./axiosInstance";

// Directory API endpoints
// Get all directories or root directory
export const getDirectories = async (directoryId = null, options = {}) => {
  const { data, statusText } = await axiosInstance.get(
    `/directory/${directoryId || ""}`,
    { signal: options.signal },
  );
  return { data, statusText };
};

// Get single directory by ID
export const getDirectoryById = async (directoryId) => {
  const { data, statusText } = await axiosInstance.get(
    `/directory/${directoryId}`,
  );
  return { data, statusText };
};

// Create new directory
export const createDirectory = async (name, parentDirId = null) => {
  const { data, statusText } = await axiosInstance.post(
    `/directory/${parentDirId}`,
    {
      dirName: name,
    },
  );
  return { data, statusText };
};

// Update directory (rename)
export const updateDirectory = async (directoryId, name) => {
  const { data, statusText } = await axiosInstance.patch(
    `/directory/${directoryId}`,
    {
      newName: name,
    },
  );
  return { data, statusText };
};

// Delete directory
export const deleteDirectory = async (directoryId) => {
  const { data, statusText } = await axiosInstance.delete(
    `/directory/${directoryId}`,
  );
  return { data, statusText };
};

// Get directory contents (files and subdirectories)
export const getDirectoryContents = async (directoryId) => {
  const { data, statusText } = await axiosInstance.get(
    `/directory/${directoryId}/contents`,
  );
  return { data, statusText };
};

// Move directory
export const moveDirectory = async (directoryId, newParentId) => {
  const { data, statusText } = await axiosInstance.put(
    `/directory/${directoryId}/move`,
    {
      newParentId,
    },
  );
  return { data, statusText };
};
