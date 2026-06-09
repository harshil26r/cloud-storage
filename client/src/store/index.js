import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import uiReducer from "./uiSlice";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import directoryReducer from "./directorySlice";
import fileReducer from "./fileSlice";
import googleDriveReducer from "./googleDriveSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    ui: uiReducer,
    auth: authReducer,
    user: userReducer,
    directory: directoryReducer,
    file: fileReducer,
    googleDrive: googleDriveReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
