import { useEffect, useState } from "react";
import { getFileSyncState, makeFileOffline } from "../../api/googleDriveAPI";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import { CloudIcon, DeviceIcon, SyncIcon } from "./icons";

const STATUS_CONFIG = {
  online_only: {
    label: "Online only",
    icon: CloudIcon,
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  downloading: {
    label: "Downloading",
    icon: SyncIcon,
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Available offline",
    icon: DeviceIcon,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
};

export default function FileStatusIndicator({
  fileId,
  googleId,
  initialState,
  compact = false,
  onStatusChange,
}) {
  const [fileState, setFileState] = useState(initialState || null);
  const [downloading, setDownloading] = useState(false);

  const fetchFileState = async () => {
    try {
      const { data } = await getFileSyncState(fileId);
      setFileState(data);
      onStatusChange?.(data);
    } catch (error) {
      console.error("Error fetching file state:", error);
    }
  };

  const handleMakeOffline = async (e) => {
    e?.stopPropagation();
    setDownloading(true);
    try {
      const { data } = await makeFileOffline(fileId);
      showSuccessToast(data.message);
      setFileState((prev) => ({
        ...prev,
        syncState: "downloading",
        downloadProgress: 0,
      }));

      const pollInterval = setInterval(async () => {
        try {
          const { data: newState } = await getFileSyncState(fileId);
          setFileState(newState);
          if (newState.syncState === "offline") {
            clearInterval(pollInterval);
            showSuccessToast("File is now available offline");
            onStatusChange?.(newState);
          }
        } catch {
          clearInterval(pollInterval);
        }
      }, 2000);

      setTimeout(() => clearInterval(pollInterval), 600000);
    } catch (error) {
      showErrorToast(error.message);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!googleId) return;

    if (initialState) {
      setFileState((prev) => ({ ...prev, ...initialState }));
    } else {
      fetchFileState();
    }

    const shouldPoll =
      !initialState || initialState.syncState === "downloading";
    if (!shouldPoll) return;

    const interval = setInterval(fetchFileState, 3000);
    return () => clearInterval(interval);
  }, [fileId, googleId]);

  if (!fileState) return null;

  const config =
    STATUS_CONFIG[fileState.syncState] || STATUS_CONFIG.online_only;
  const Icon = config.icon;
  const isDownloading = fileState.syncState === "downloading";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${config.className}`}
        title={config.label}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {isDownloading
          ? `${fileState.downloadProgress}%`
          : config.label.split(" ")[0]}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.className}`}
      >
        <Icon className="w-3.5 h-3.5" spinning={isDownloading} />
        {isDownloading
          ? `Downloading ${fileState.downloadProgress}%`
          : config.label}
      </span>

      {fileState.syncState === "online_only" && (
        <button
          onClick={handleMakeOffline}
          disabled={downloading}
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          <DeviceIcon className="w-3 h-3" />
          {downloading ? "Starting…" : "Save offline"}
        </button>
      )}

      {isDownloading && (
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${fileState.downloadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
