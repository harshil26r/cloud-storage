import { createContext, useContext, useState, useCallback } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [viewMode, setViewModeState] = useState("list");

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
  }, []);

  return (
    <UIContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </UIContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
