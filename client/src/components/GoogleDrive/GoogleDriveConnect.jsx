import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import {
  connectGoogleDrive,
  initializeGoogleDriveStorage,
} from "../../api/googleDriveAPI";
import { GoogleDriveLogo } from "./icons";

const FOLDER_PRESETS = ["Google Drive", "My Drive", "Cloud Files"];

export default function GoogleDriveConnect({ onConnected }) {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [folderName, setFolderName] = useState("Google Drive");
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setLoading(true);
      try {
        const { data, statusText } = await connectGoogleDrive(
          codeResponse.code,
        );

        if (statusText === "OK") {
          showSuccessToast("Google Drive connected successfully");

          if (data.requiresSetup) {
            setShowNameDialog(true);
          } else {
            onConnected?.();
          }
        } else {
          showErrorToast(data.error || "Connection failed");
        }
      } catch (error) {
        showErrorToast(error.message);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      showErrorToast("Google login failed");
      console.error("Google login error:", error);
    },
    flow: "auth-code",
    scope: "https://www.googleapis.com/auth/drive",
  });

  const handleSetupFolder = async () => {
    if (!folderName.trim()) {
      showErrorToast("Please enter a folder name");
      return;
    }

    setLoading(true);
    try {
      const { data, statusText } = await initializeGoogleDriveStorage(
        folderName.trim(),
      );

      if (statusText === "Created") {
        showSuccessToast(data.message);
        setShowNameDialog(false);
        setFolderName("Google Drive");
        onConnected?.();
      } else {
        showErrorToast(data.error || "Setup failed");
      }
    } catch (error) {
      showErrorToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <GoogleDriveLogo className="w-10 h-10" />
        </div>

        <h3 className="text-sm font-semibold text-slate-900">
          Connect your Google Drive
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
          Sync files and folders while keeping your storage preference —
          metadata only or full downloads.
        </p>

        <button
          onClick={() => login()}
          disabled={loading}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1a73e8] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1557b0] hover:shadow disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Connecting…
            </>
          ) : (
            <>
              <GoogleDriveLogo className="w-4 h-4" />
              Sign in with Google
            </>
          )}
        </button>
      </div>

      {showNameDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !loading && setShowNameDialog(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <svg
                  className="h-5 w-5 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Name your Drive folder
                </h3>
                <p className="text-xs text-slate-500">
                  This appears in your file browser
                </p>
              </div>
            </div>

            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleSetupFolder()}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {FOLDER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFolderName(preset)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    folderName === preset
                      ? "bg-[#1a73e8] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowNameDialog(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetupFolder}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#1a73e8] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1557b0] disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create folder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
