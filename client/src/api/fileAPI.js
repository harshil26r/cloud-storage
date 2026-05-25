import axiosInstance from "./axiosInstance";

// File API endpoints
// Get all file or file in a directory
export const getFile = async (directoryId = null) => {
  const params = directoryId ? { directoryId } : {};
  const { data, statusText } = await axiosInstance.get("/file", { params });
  return { data, statusText };
};

// Get single file by ID
export const getFileById = async (fileId) => {
  const { data, statusText } = await axiosInstance.get(`/file/${fileId}`);
  return { data, statusText };
};

// Upload file
export const uploadFile = async (formData, onUploadProgress = null) => {
  const { data, statusText } = await axiosInstance.post(
    "/file/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    },
  );
  return { data, statusText };
};

// Download file
export const downloadFile = async (fileId) => {
  return axiosInstance.get(`/file/${fileId}/download`, {
    responseType: "blob",
  });
};

// Delete file
export const deleteFile = async (fileId) => {
  const { data, statusText } = await axiosInstance.delete(`/file/${fileId}`);
  return { data, statusText };
};

// Rename file
export const renameFile = async (fileId, newName) => {
  const { data, statusText } = await axiosInstance.patch(`/file/${fileId}`, {
    newName,
  });
  return { data, statusText };
};

// Move file to another directory
export const moveFile = async (fileId, newDirectoryId) => {
  const { data, statusText } = await axiosInstance.put(`/file/${fileId}/move`, {
    directoryId: newDirectoryId,
  });
  return { data, statusText };
};

// Get file details/metadata
export const getFileMetadata = async (fileId) => {
  const { data, statusText } = await axiosInstance.get(
    `/file/${fileId}/metadata`,
  );
  return { data, statusText };
};

// Delete multiple file
export const deleteMultipleFile = async (fileIds) => {
  const { data, statusText } = await axiosInstance.post(
    "/file/delete-multiple",
    {
      fileIds,
    },
  );
  return { data, statusText };
};
