import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authAPI from "../api/authAPI";

export const sendOtpAction = createAsyncThunk(
  "auth/sendOtp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.sendOtp(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const verifyOtpAction = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyOtp(email, otp);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const verifyGoogleTokenAction = createAsyncThunk(
  "auth/verifyGoogleToken",
  async (tokenId, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyGoogleToken(tokenId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const getGoogleDriveDataAction = createAsyncThunk(
  "auth/getGoogleDriveData",
  async (code, { rejectWithValue }) => {
    try {
      const response = await authAPI.getGoogleDriveData(code);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        },
      );
  },
});

export default authSlice.reducer;
