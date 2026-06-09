import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as fileAPI from "../api/fileAPI";

export const fetchFiles = createAsyncThunk(
  "file/fetch",
  async (directoryId, { rejectWithValue }) => {
    try {
      const response = await fileAPI.getFile(directoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFileById = createAsyncThunk(
  "file/fetchById",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await fileAPI.getFileById(fileId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadNewFile = createAsyncThunk(
  "file/upload",
  async ({ formData, onUploadProgress }, { rejectWithValue }) => {
    try {
      const response = await fileAPI.uploadFile(formData, onUploadProgress);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteSingleFile = createAsyncThunk(
  "file/delete",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await fileAPI.deleteFile(fileId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const renameFileAction = createAsyncThunk(
  "file/rename",
  async ({ fileId, newName }, { rejectWithValue }) => {
    try {
      const response = await fileAPI.renameFile(fileId, newName);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const moveFileAction = createAsyncThunk(
  "file/move",
  async ({ fileId, newDirectoryId }, { rejectWithValue }) => {
    try {
      const response = await fileAPI.moveFile(fileId, newDirectoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFileMetadata = createAsyncThunk(
  "file/fetchMetadata",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await fileAPI.getFileMetadata(fileId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteMultipleFiles = createAsyncThunk(
  "file/deleteMultiple",
  async (fileIds, { rejectWithValue }) => {
    try {
      const response = await fileAPI.deleteMultipleFile(fileIds);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const fileSlice = createSlice({
  name: "file",
  initialState: {
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) =>
          action.type.startsWith("file/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("file/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("file/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        },
      );
  },
});

export default fileSlice.reducer;
