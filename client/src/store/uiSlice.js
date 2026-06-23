import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    viewMode: "list",
  },
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
  },
});

export const { setViewMode } = uiSlice.actions;
export default uiSlice.reducer;
