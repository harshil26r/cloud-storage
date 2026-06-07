import { createContext, useContext, useState, useCallback } from "react";
import { getProfile, logout, logoutAll } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setUser = useCallback((user) => {
    setUserState(user);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
  }, []);

  const updateGoogleDriveStatus = useCallback((connected) => {
    setUserState((prev) => {
      if (!prev) return prev;
      return { ...prev, googleDriveConnected: connected };
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, statusText } = await getProfile();
      if (statusText === "OK") {
        setUserState(data);
        setLoading(false);
        return { success: true, payload: data };
      } else {
        const errMsg = data?.error || "Failed to fetch profile";
        setError(errMsg);
        setLoading(false);
        return { success: false, payload: errMsg };
      }
    } catch (err) {
      const errMsg = err.message || "Failed to fetch profile";
      setError(errMsg);
      setLoading(false);
      return { success: false, payload: errMsg };
    }
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      const { data, statusText } = await logout();
      if (statusText === "OK") {
        setUserState(null);
        return { success: true, payload: data };
      } else {
        return { success: false, payload: data?.error || "Logout failed" };
      }
    } catch (err) {
      return { success: false, payload: err.message || "Logout failed" };
    }
  }, []);

  const logoutAllDevices = useCallback(async () => {
    try {
      const { data, statusText } = await logoutAll();
      if (statusText === "OK") {
        setUserState(null);
        return { success: true, payload: data };
      } else {
        return { success: false, payload: data?.error || "Logout all failed" };
      }
    } catch (err) {
      return { success: false, payload: err.message || "Logout all failed" };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setUser,
        clearUser,
        updateGoogleDriveStatus,
        fetchProfile,
        logoutUser,
        logoutAllDevices,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
