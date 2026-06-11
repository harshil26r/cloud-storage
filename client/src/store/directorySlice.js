import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as directoryAPI from "../api/directoryAPI";
import * as shareAPI from "../api/shareAPI";
import axiosInstance from "../api/axiosInstance";

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

export const fetchSharedWithMe = createAsyncThunk(
  "directory/fetchSharedWithMe",
  async (_, { rejectWithValue }) => {
    try {
      const response = await shareAPI.getSharedWithMe();
      return response;
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

export const fetchTrashBin = createAsyncThunk(
  "directory/fetchTrashBin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/directory/trash-bin");
      return response.data; // { files, directories }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const emptyTrashBin = createAsyncThunk(
  "directory/emptyTrashBin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/directory/trash/empty");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchStarredItems = createAsyncThunk(
  "directory/fetchStarredItems",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/directory/starred");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchRecentFiles = createAsyncThunk(
  "directory/fetchRecentFiles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/file/recent");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
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
      })
      .addCase(fetchSharedWithMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedWithMe.fulfilled, (state, action) => {
        state.loading = false;
        state.directories = action.payload?.directories || [];
        state.files = action.payload?.files || [];
        state.currentDir = { name: "Shared with me", isVirtualSharedRoot: true };
      })
      .addCase(fetchSharedWithMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchTrashBin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrashBin.fulfilled, (state, action) => {
        state.loading = false;
        state.directories = action.payload.directories;
        state.files = action.payload.files;
        state.currentDir = { name: "Trash", isTrashMode: true };
      })
      .addCase(fetchTrashBin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStarredItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStarredItems.fulfilled, (state, action) => {
        state.loading = false;
        state.directories = action.payload.directories || [];
        state.files = action.payload.files || [];
        state.currentDir = { name: "Starred", isStarredMode: true };
      })
      .addCase(fetchStarredItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRecentFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.directories = [];
        state.files = action.payload.files || [];
        state.currentDir = { name: "Recent", isRecentMode: true };
      })
      .addCase(fetchRecentFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default directorySlice.reducer;
