import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { showSuccessToast, showErrorToast } from "../utils/toastConfig";
import { getProfile, logout, logoutAll } from "../api";
import { GoogleDriveSettings, GoogleDrivePanel } from "./GoogleDrive";
import { GoogleDriveLogo } from "./GoogleDrive/icons";

export default function Header({
  viewMode,
  onViewChange,
  onGoogleDriveStatusChange,
  onSyncComplete,
}) {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGoogleDrivePanel, setShowGoogleDrivePanel] = useState(false);
  const navigate = useNavigate();

  const fetchUserInfo = async () => {
    try {
      const { data, statusText } = await getProfile();
      if (statusText === "OK") {
        setUser(data);
      } else {
        showErrorToast(data.error);
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      showErrorToast(error.message);
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    try {
      const { data, statusText } = await logout();
      if (statusText === "OK") {
        showSuccessToast(data.message);
        setTimeout(() => navigate("/login"), 500);
      } else {
        showErrorToast(data.error);
      }
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleLogoutAll = async () => {
    try {
      const { data, statusText } = await logoutAll();
      if (statusText === "OK") {
        showSuccessToast(data.message);
        setTimeout(() => navigate("/login"), 500);
      } else {
        showErrorToast(data.error);
      }
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const getInitials = (email) => (email ? email.charAt(0).toUpperCase() : "U");

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                My files
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="hidden sm:flex items-center rounded-lg bg-slate-100 p-0.5">
                {[
                  {
                    mode: "list",
                    title: "List view",
                    path: "M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z",
                  },
                  {
                    mode: "grid",
                    title: "Grid view",
                    path: "M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM12 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM12 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
                  },
                ].map(({ mode, title, path }) => (
                  <button
                    key={mode}
                    onClick={() => onViewChange(mode)}
                    className={`rounded-md p-1.5 transition-all ${
                      viewMode === mode
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    title={title}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d={path} clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Google Drive button */}
              <button
                onClick={() => {
                  setShowGoogleDrivePanel(true);
                  setShowUserMenu(false);
                }}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  user?.googleDriveConnected
                    ? "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-sm"
                    : "bg-[#1a73e8]/10 text-[#1a73e8] hover:bg-[#1a73e8]/15"
                }`}
                title="Google Drive"
              >
                <GoogleDriveLogo className="h-4 w-4" />
                <span className="hidden sm:inline">Drive</span>
                {user?.googleDriveConnected && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100"
                >
                  {user?.picture ? (
                    <img
                      className="h-8 w-8 rounded-full ring-2 ring-white"
                      src={user.picture}
                      alt=""
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full from-blue-500 to-blue-600 text-sm font-semibold text-white">
                      {user && getInitials(user.email)}
                    </div>
                  )}
                  <svg
                    className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user?.username || "User"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowGoogleDrivePanel(true);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <GoogleDriveLogo className="h-4 w-4" />
                          Google Drive settings
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Log out
                        </button>
                        <button
                          onClick={() => {
                            handleLogoutAll();
                            setShowUserMenu(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Log out all devices
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <GoogleDrivePanel
        isOpen={showGoogleDrivePanel}
        onClose={() => setShowGoogleDrivePanel(false)}
      >
        <GoogleDriveSettings
          googleDriveConnected={user?.googleDriveConnected || false}
          onStatusChange={(connected) => {
            setUser((prev) => ({ ...prev, googleDriveConnected: connected }));
            onGoogleDriveStatusChange?.(connected);
          }}
          onSyncComplete={() => {
            onSyncComplete?.();
          }}
        />
      </GoogleDrivePanel>
    </>
  );
}
