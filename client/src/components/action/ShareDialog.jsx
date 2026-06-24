import { useState, useEffect, useRef } from "react";
import * as shareAPI from "../../api/shareAPI";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";

export default function ShareDialog({
  isOpen,
  itemId,
  isFile,
  onClose,
  onShareSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [sharedWith, setSharedWith] = useState([]);
  const [generalAccess, setGeneralAccess] = useState("restricted");
  const [allowEditorShare, setAllowEditorShare] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [_googleId, setGoogleId] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState({ name: "Owner", email: "" });

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copying, setCopying] = useState(false);

  const searchRef = useRef(null);
  const searchControllerRef = useRef(null);

  // Fetch share settings on open
  useEffect(() => {
    if (isOpen && itemId) {
      const fetchSettings = async () => {
        setLoading(true);
        try {
          const data = await shareAPI.getShareSettings(itemId, isFile);
          setSharedWith(data.sharedWith || []);
          setGeneralAccess(data.generalAccess || "restricted");
          setAllowEditorShare(data.settings?.allowEditorShare ?? true);
          setAllowDownload(data.settings?.allowDownload ?? true);
          setGoogleId(data.googleId);

          // Note: Owner info would ideally come from backend; if not provided, default or handle
          if (data.owner) {
            setOwnerInfo(data.owner);
          } else {
            setOwnerInfo({ name: "Owner", email: "" });
          }
        } catch (error) {
          console.error("Failed to load share settings:", error);
          showErrorToast("Failed to load share settings");
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen, itemId, isFile]);

  // Click outside search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchTextChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Abort any ongoing search request immediately on input change
    if (searchControllerRef.current) {
      searchControllerRef.current.abort();
    }
    searchControllerRef.current = new AbortController();
  };

  // Search users on typing query
  useEffect(() => {
    const controller = searchControllerRef.current;
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const results = await shareAPI.searchUsers(searchQuery, {
            signal: controller?.signal,
          });
          setSearchResults(results);
          setShowDropdown(true);
        } catch (error) {
          // Ignore cancellation errors
          if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
            return;
          }
          console.error("User search failed:", error);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounce);
      // Cleanup: Abort outstanding request if query changes or component unmounts
      if (controller) {
        controller.abort();
      }
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleAddPerson = (user, role = "viewer") => {
    // Check if user is already added
    const isAlreadyShared = sharedWith.some(
      (share) => share.userId === user._id || share.email === user.email,
    );
    if (isAlreadyShared) {
      showErrorToast("User is already in the list");
      return;
    }

    setSharedWith([
      ...sharedWith,
      {
        userId: user._id,
        email: user.email,
        username: user.username,
        picture: user.picture,
        role: role,
      },
    ]);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRoleChange = (index, role) => {
    const updated = [...sharedWith];
    if (role === "remove") {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...updated[index], role };
    }
    setSharedWith(updated);
  };

  const handleCopyLink = async () => {
    try {
      const baseUrl = window.location.origin;
      const link = isFile
        ? `${baseUrl}/file/${itemId}?action=open`
        : `${baseUrl}/directory/${itemId}`;

      await navigator.clipboard.writeText(link);
      setCopying(true);
      showSuccessToast("Link copied to clipboard");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      showErrorToast("Failed to copy link");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const shareData = {
        sharedWith: sharedWith.map((s) => ({
          userId: s.userId,
          email: s.email,
          role: s.role,
        })),
        generalAccess,
        settings: {
          allowEditorShare,
          allowDownload,
        },
      };

      await shareAPI.updateShareSettings(itemId, isFile, shareData);
      showSuccessToast("Share settings updated successfully");
      if (onShareSuccess) onShareSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save share settings:", error);
      showErrorToast(
        error.response?.data?.error ||
          error.message ||
          "Failed to save share settings",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-w-full mx-4 overflow-hidden dark:bg-gray-900 border dark:border-gray-800 transition-all">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {showSettings && (
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {showSettings
                ? "Sharing settings"
                : `Share "${isFile ? "File" : "Folder"}"`}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {!showSettings && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
                title="Sharing settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : showSettings ? (
          /* Settings Panel View */
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEditorShare}
                  onChange={(e) => setAllowEditorShare(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                    Allow editors to change permissions and share
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    If unchecked, only the owner can change permissions and
                    add/remove users.
                  </span>
                </div>
              </label>

              {isFile && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                      Allow viewers to download, copy, and print
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      If unchecked, users with Viewer role cannot download or
                      save copies of this file.
                    </span>
                  </div>
                </label>
              )}
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          /* Main Sharing View */
          <div className="p-6 space-y-6">
            {/* User Search Input */}
            <div ref={searchRef} className="relative">
              <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-gray-50 dark:bg-gray-800/40">
                <svg
                  className="w-5 h-5 text-gray-400 ml-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchTextChange}
                  placeholder="Add people, groups, and calendar events"
                  className="w-full px-3 py-2.5 bg-transparent border-none focus:outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 py-1 dark:bg-gray-800 animate-slide-up">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleAddPerson(user)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <img
                        src={
                          user.picture ||
                          "https://static.vecteezy.com/system/resources/previews/002/318/271/non_2x/user-profile-icon-free-vector.jpg"
                        }
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-gray-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* People with Access */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                People with access
              </h3>

              <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                {/* Owner */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shrink-0 dark:bg-blue-900/30 dark:text-blue-400">
                      O
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {ownerInfo.name} (you)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ownerInfo.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium px-2 py-1 rounded bg-gray-50 dark:bg-gray-800">
                    Owner
                  </span>
                </div>

                {/* Shared Users */}
                {sharedWith.map((share, idx) => (
                  <div
                    key={share.userId || idx}
                    className="flex items-center justify-between gap-3 animate-fade-in"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          share.picture ||
                          "https://static.vecteezy.com/system/resources/previews/002/318/271/non_2x/user-profile-icon-free-vector.jpg"
                        }
                        alt={share.username || share.email}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {share.username || share.email.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {share.email}
                        </p>
                      </div>
                    </div>

                    <select
                      value={share.role}
                      onChange={(e) => handleRoleChange(idx, e.target.value)}
                      className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="remove">Remove access</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* General Access */}
            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                General access
              </h3>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 dark:bg-gray-800 text-gray-500">
                    {generalAccess === "restricted" ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <select
                      value={generalAccess}
                      onChange={(e) => setGeneralAccess(e.target.value)}
                      className="text-sm font-semibold text-gray-800 bg-transparent border-none p-0 focus:outline-none dark:text-gray-200 cursor-pointer"
                    >
                      <option value="restricted">Restricted</option>
                      <option value="anyone_view">Anyone with the link</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {generalAccess === "restricted"
                        ? "Only people with access can open with the link"
                        : "Anyone on the internet with the link can view"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                {copying ? "Link copied!" : "Copy link"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
                  {saving && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  )}
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
