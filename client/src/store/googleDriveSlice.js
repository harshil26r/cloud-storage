import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as googleDriveAPI from "../api/googleDriveAPI";

export const connectGDrive = createAsyncThunk(
  "googleDrive/connect",
  async (code, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.connectGoogleDrive(code);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const disconnectGDrive = createAsyncThunk(
  "googleDrive/disconnect",
  async (_, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.disconnectGoogleDrive();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const initializeGDriveStorage = createAsyncThunk(
  "googleDrive/initialize",
  async (rootFolderName, { rejectWithValue }) => {
    try {
      const response =
        await googleDriveAPI.initializeGoogleDriveStorage(rootFolderName);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const syncGDrive = createAsyncThunk(
  "googleDrive/sync",
  async (_, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.syncGoogleDrive();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchSyncStatus = createAsyncThunk(
  "googleDrive/fetchSyncStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.getSyncStatus();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchGDrivePreferences = createAsyncThunk(
  "googleDrive/fetchPreferences",
  async (_, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.getGoogleDrivePreferences();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateGDrivePreferences = createAsyncThunk(
  "googleDrive/updatePreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      const response =
        await googleDriveAPI.updateGoogleDrivePreferences(preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const makeGDriveOffline = createAsyncThunk(
  "googleDrive/makeOffline",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.makeFileOffline(fileId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFileSyncState = createAsyncThunk(
  "googleDrive/fetchFileSyncState",
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.getFileSyncState(fileId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadGDriveFile = createAsyncThunk(
  "googleDrive/uploadFile",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.uploadToGoogleDrive(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteGDriveFile = createAsyncThunk(
  "googleDrive/deleteFile",
  async ({ fileId, deleteLocal }, { rejectWithValue }) => {
    try {
      const response = await googleDriveAPI.deleteGoogleFile(
        fileId,
        deleteLocal,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const googleDriveSlice = createSlice({
  name: "googleDrive",
  initialState: {
    syncStatus: null,
    preferences: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSyncStatus.fulfilled, (state, action) => {
        state.syncStatus = action.payload;
      })
      .addCase(fetchGDrivePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("googleDrive/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("googleDrive/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("googleDrive/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        },
      );
  },
});

export default googleDriveSlice.reducer;
