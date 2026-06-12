import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchProfile,
  logoutUser,
  logoutAllDevices,
  updateGoogleDriveStatus,
} from "../store/userSlice";
import { toggleTheme } from "../store/themeSlice";
import { setViewMode } from "../store/uiSlice";
import { showSuccessToast, showErrorToast } from "../utils/toastConfig";
import { GoogleDriveSettings, GoogleDrivePanel } from "./GoogleDrive";
import { GoogleDriveLogo } from "./GoogleDrive/icons";

export default function Header({ onSyncComplete, onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.user);
  const darkMode = useSelector((state) => state.theme.darkMode);
  const viewMode = useSelector((state) => state.ui.viewMode);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGoogleDrivePanel, setShowGoogleDrivePanel] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const handleLogout = async () => {
    const result = await dispatch(logoutUser());

    if (!result.error) {
      showSuccessToast(result.payload?.message || "Logged out");
      setTimeout(() => navigate("/login"), 500);
    } else {
      showErrorToast(result.payload || "Logout failed");
    }
  };

  const handleLogoutAll = async () => {
    const result = await dispatch(logoutAllDevices());
    if (!result.error) {
      showSuccessToast(
        result.payload?.message || "Logged out from all devices",
      );
      setTimeout(() => navigate("/login"), 500);
    } else {
      showErrorToast(result.payload || "Logout all failed");
    }
  };

  const getInitials = (email) => (email ? email.charAt(0).toUpperCase() : "U");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-700/80 dark:bg-gray-900/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Hamburger Menu button for mobile */}
              <button
                onClick={onToggleMobileSidebar}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
                title="Open menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-gray-100">
                My files
              </h1>
            </div>

            <div className="hidden sm:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search in My Drive"
                  className="w-full rounded-lg bg-gray-100 pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-gray-800">
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
                    onClick={() => dispatch(setViewMode(mode))}
                    className={`rounded-md p-1.5 transition-all ${
                      viewMode === mode
                        ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                        : "text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
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

              <button
                onClick={() => dispatch(toggleTheme())}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
                title={darkMode ? "Light mode" : "Dark mode"}
              >
                {darkMode ? (
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
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
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
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  setShowGoogleDrivePanel(true);
                  setShowUserMenu(false);
                }}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  user?.googleDriveConnected
                    ? "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:ring-gray-600"
                    : "bg-[#1a73e8]/10 text-[#1a73e8] hover:bg-[#1a73e8]/15"
                }`}
                title="Google Drive"
              >
                <GoogleDriveLogo className="h-4 w-4" />
                <span className="hidden sm:inline">Drive</span>
                {user?.googleDriveConnected && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800"
                >
                  {user?.picture ? (
                    <img
                      className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900"
                      src={user.picture}
                      alt=""
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
                      {user && getInitials(user.email)}
                    </div>
                  )}
                  <svg
                    className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform dark:text-gray-500 ${showUserMenu ? "rotate-180" : ""}`}
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
                    <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <div className="border-b border-slate-100 px-4 py-3 dark:border-gray-700">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-gray-100">
                          {user?.username || "User"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowGoogleDrivePanel(true);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <GoogleDriveLogo className="h-4 w-4" />
                          Google Drive settings
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
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
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
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
            dispatch(updateGoogleDriveStatus(connected));
          }}
          onSyncComplete={() => {
            onSyncComplete?.();
          }}
        />
      </GoogleDrivePanel>
    </>
  );
}
