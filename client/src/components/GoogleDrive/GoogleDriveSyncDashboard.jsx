import { useEffect, useState } from "react";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import { getSyncStatus, syncGoogleDrive } from "../../api/googleDriveAPI";
import { SyncIcon } from "./icons";

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-gray-800 dark:ring-gray-700">
      <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-xl font-semibold text-slate-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function GoogleDriveSyncDashboard({ onSyncComplete }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchSyncStatus = async () => {
    try {
      const { data, statusText } = await getSyncStatus();
      if (statusText === "OK") {
        setSyncStatus(data);
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, statusText } = await syncGoogleDrive();

      if (statusText === "OK") {
        showSuccessToast(data.message);
        setSyncStatus((prev) => ({
          ...prev,
          status: "idle",
          filesCount: data.stats.filesCount,
          foldersCount: data.stats.foldersCount,
          syncEndTime: new Date().toISOString(),
        }));
        onSyncComplete?.();
      } else {
        showErrorToast(data.error || "Sync failed");
      }
    } catch (error) {
      showErrorToast(error.message);
    } finally {
      setSyncing(false);
      fetchSyncStatus();
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isActive = syncing || syncStatus?.status === "syncing";
  const hasError = syncStatus?.status === "error";

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 rounded-xl bg-slate-100 dark:bg-gray-800" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-gray-800" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-gray-800" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div
        className={`rounded-xl p-4 ring-1 ${
          hasError
            ? "bg-red-50 ring-red-200 dark:bg-red-900/20 dark:ring-red-800"
            : isActive
              ? "bg-blue-50 ring-blue-200 dark:bg-blue-900/20 dark:ring-blue-800"
              : "bg-emerald-50 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-800"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                hasError
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : isActive
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              }`}
            >
              <SyncIcon className="w-5 h-5" spinning={isActive} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                {isActive
                  ? "Syncing with Google Drive\u2026"
                  : hasError
                    ? "Sync encountered an error"
                    : "Up to date"}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-gray-400">
                Last sync:{" "}
                {formatDate(syncStatus?.syncEndTime || syncStatus?.updatedAt)}
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isActive}
            className="shrink-0 rounded-lg bg-[#1a73e8] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1557b0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActive ? "Syncing\u2026" : "Sync now"}
          </button>
        </div>

        {hasError && syncStatus?.error && (
          <p className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-red-700 dark:bg-gray-800/60 dark:text-red-400">
            {syncStatus.error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Files"
          value={syncStatus?.filesCount ?? 0}
          icon={
            <svg
              className="h-3.5 w-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <StatCard
          label="Folders"
          value={syncStatus?.foldersCount ?? 0}
          icon={
            <svg
              className="h-3.5 w-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          }
        />
        <StatCard
          label="Status"
          value={syncStatus?.status ?? "idle"}
          icon={
            <span
              className={`h-2 w-2 rounded-full ${
                hasError
                  ? "bg-red-500"
                  : isActive
                    ? "bg-blue-500 animate-pulse"
                    : "bg-emerald-500"
              }`}
            />
          }
        />
      </div>
    </section>
  );
}
