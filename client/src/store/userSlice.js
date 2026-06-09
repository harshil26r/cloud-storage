import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as userAPI from "../api/userAPI";

export const loginUser = createAsyncThunk(
  "user/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await userAPI.login(email, password);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const signupUser = createAsyncThunk(
  "user/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userAPI.signup(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.logout();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const logoutAllDevices = createAsyncThunk(
  "user/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.logoutAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const changeUserPassword = createAsyncThunk(
  "user/changePassword",
  async ({ oldPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await userAPI.changePassword(oldPassword, newPassword);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const refreshUserToken = createAsyncThunk(
  "user/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.refreshToken();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    updateGoogleDriveStatus: (state, action) => {
      if (state.user) {
        state.user.googleDriveConnected = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload || action.error.message;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.user = action.payload.data;
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { setUser, clearUser, updateGoogleDriveStatus } =
  userSlice.actions;
export default userSlice.reducer;
