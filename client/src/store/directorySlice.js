import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as directoryAPI from "../api/directoryAPI";

export const fetchDirectories = createAsyncThunk(
  "directory/fetchDirectories",
  async (directoryId, { rejectWithValue }) => {
    try {
      const response = await directoryAPI.getDirectories(directoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchDirById = createAsyncThunk(
  "directory/fetchById",
  async (directoryId, { rejectWithValue }) => {
    try {
      const response = await directoryAPI.getDirectoryById(directoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createDir = createAsyncThunk(
  "directory/create",
  async ({ name, parentDirId }, { rejectWithValue }) => {
    try {
      const response = await directoryAPI.createDirectory(name, parentDirId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateDir = createAsyncThunk(
  "directory/update",
  async ({ directoryId, name }, { rejectWithValue }) => {
    try {
      const response = await directoryAPI.updateDirectory(directoryId, name);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteDir = createAsyncThunk(
  "directory/delete",
  async (directoryId, { rejectWithValue }) => {
    try {
      const response = await directoryAPI.deleteDirectory(directoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchDirContents = createAsyncThunk(
  "directory/fetchContents",
  async (directoryId, { rejectWithValue }) => {
    try {
      const response = await directoryAPI.getDirectoryContents(directoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const moveDir = createAsyncThunk(
  "directory/move",
  async ({ directoryId, newParentId }, { rejectWithValue }) => {
    try {
      const response = await directoryAPI.moveDirectory(
        directoryId,
        newParentId,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const directorySlice = createSlice({
  name: "directory",
  initialState: {
    directories: [],
    files: [],
    currentDir: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDirectories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDirectories.fulfilled, (state, action) => {
        state.loading = false;
        state.directories = action.payload?.directories || [];
        state.files = action.payload?.files || [];
        state.currentDir = action.payload || null;
      })
      .addCase(fetchDirectories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default directorySlice.reducer;
