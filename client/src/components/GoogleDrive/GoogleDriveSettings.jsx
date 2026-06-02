import { useEffect, useState } from "react";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import { disconnectGoogleDrive } from "../../api/googleDriveAPI";
import GoogleDriveConnect from "./GoogleDriveConnect";
import GoogleDriveSyncDashboard from "./GoogleDriveSyncDashboard";
import GoogleDrivePreferences from "./GoogleDrivePreferences";

const TABS = [
  { id: "sync", label: "Sync" },
  { id: "settings", label: "Storage" },
];

export default function GoogleDriveSettings({
  googleDriveConnected,
  onStatusChange,
  onSyncComplete,
}) {
  const [connected, setConnected] = useState(googleDriveConnected);
  const [disconnecting, setDisconnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("sync");

  useEffect(() => {
    setConnected(googleDriveConnected);
  }, [googleDriveConnected]);

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Disconnect Google Drive? Synced files will remain but won't update.",
      )
    ) {
      return;
    }

    setDisconnecting(true);
    try {
      const { data, statusText } = await disconnectGoogleDrive();

      if (statusText === "OK") {
        showSuccessToast(data.message);
        setConnected(false);
        onStatusChange?.(false);
      } else {
        showErrorToast(data.error || "Disconnect failed");
      }
    } catch (error) {
      showErrorToast(error.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnected = () => {
    setConnected(true);
    setActiveTab("sync");
    onStatusChange?.(true);
  };

  if (!connected) {
    return <GoogleDriveConnect onConnected={handleConnected} />;
  }

  return (
    <div className="space-y-5">
      {/* Connection badge */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-900">Connected</p>
            <p className="text-[11px] text-emerald-700">
              Google Drive is linked
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {disconnecting ? "…" : "Disconnect"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "sync" && (
        <GoogleDriveSyncDashboard onSyncComplete={onSyncComplete} />
      )}

      {activeTab === "settings" && <GoogleDrivePreferences />}
    </div>
  );
}
