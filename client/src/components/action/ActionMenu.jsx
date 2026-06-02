import { useState } from "react";

export default function ActionMenu({
  item,
  isFile,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  onMakeOffline,
  onOpenInDrive,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isGoogleFile = isFile && item?.googleId;
  const isOnlineOnly =
    isGoogleFile &&
    item?.syncState === "online_only" &&
    item?.storageMode !== "offline";

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  const menuItemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors";

  return (
    <div className="relative inline-block">
      <button
        onClick={toggleMenu}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        title="More options"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleAction(onOpen)}
              className={`${menuItemClass} text-slate-700 hover:bg-slate-50`}
            >
              <svg
                className="h-4 w-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Preview
            </button>

            {isFile && (
              <button
                onClick={() => handleAction(onDownload)}
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50`}
              >
                <svg
                  className="h-4 w-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            )}

            {isOnlineOnly && onMakeOffline && (
              <button
                onClick={() => handleAction(onMakeOffline)}
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50`}
              >
                <svg
                  className="h-4 w-4 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 004 4h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Save offline
              </button>
            )}

            {isGoogleFile && item?.webViewLink && onOpenInDrive && (
              <button
                onClick={() => handleAction(onOpenInDrive)}
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50`}
              >
                <svg
                  className="h-4 w-4 text-[#1a73e8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open in Drive
              </button>
            )}

            <button
              onClick={() => handleAction(onRename)}
              className={`${menuItemClass} text-slate-700 hover:bg-slate-50`}
            >
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Rename
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => handleAction(onDelete)}
              className={`${menuItemClass} text-red-600 hover:bg-red-50`}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
