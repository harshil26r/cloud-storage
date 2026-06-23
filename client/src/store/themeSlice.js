import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  const stored = localStorage.getItem("theme");
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    darkMode: getInitialTheme(),
  },
  reducers: {
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem("theme", state.darkMode ? "dark" : "light");
      document.documentElement.classList.toggle("dark", state.darkMode);
    },
    setTheme: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem("theme", state.darkMode ? "dark" : "light");
      document.documentElement.classList.toggle("dark", state.darkMode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
