import { useEffect, useState } from "react";
import { showSuccessToast, showErrorToast } from "../../utils/toastConfig";
import {
  getGoogleDrivePreferences,
  updateGoogleDrivePreferences,
} from "../../api/googleDriveAPI";
import { CloudIcon, DeviceIcon } from "./icons";

const STORAGE_OPTIONS = [
  {
    value: "metadata_only",
    title: "Metadata only",
    description:
      "Index files in the cloud without downloading. Open files on demand.",
    icon: CloudIcon,
    accent: "border-sky-200 bg-sky-50 text-sky-700",
    selectedRing: "ring-sky-500",
  },
  {
    value: "full_file",
    title: "Full files",
    description:
      "Automatically download new and updated files for offline access.",
    icon: DeviceIcon,
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
    selectedRing: "ring-emerald-500",
  },
];

export default function GoogleDrivePreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = async () => {
    try {
      const { data } = await getGoogleDrivePreferences();
      setPreferences(data);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (newPref) => {
    if (newPref === preferences?.googleDriveSyncPreference) return;

    setSaving(true);
    try {
      const { data, statusText } = await updateGoogleDrivePreferences({
        googleDriveSyncPreference: newPref,
      });

      if (statusText === "OK") {
        showSuccessToast("Storage preference updated");
        setPreferences((prev) => ({
          ...prev,
          googleDriveSyncPreference: newPref,
        }));
      }
    } catch (error) {
      showErrorToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
        <div className="h-20 rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!preferences?.googleDriveConnected) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Storage mode</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Choose how synced files are stored on this device
        </p>
      </div>

      <div className="space-y-2">
        {STORAGE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected =
            preferences.googleDriveSyncPreference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => handleSavePreferences(option.value)}
              className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? `border-transparent bg-white ring-2 ${option.selectedRing} shadow-sm`
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              } disabled:opacity-60`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${option.accent}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {option.title}
                    </p>
                    {isSelected && (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Root folder</dt>
            <dd className="font-medium text-slate-800 text-right">
              {preferences.rootGoogleDriveName || "Google Drive"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Last sync</dt>
            <dd className="font-medium text-slate-800 text-right">
              {formatDate(preferences.lastSyncTime)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
