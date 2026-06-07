import { GoogleDriveLogo } from "./icons";

export default function GoogleDrivePanel({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in-right dark:bg-gray-900"
        role="dialog"
        aria-label="Google Drive settings"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-gray-800 dark:ring-gray-700">
              <GoogleDriveLogo className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100">
                Google Drive
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">Sync & storage settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close panel"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}
