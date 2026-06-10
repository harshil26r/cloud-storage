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
  onShare,
  isTrashMode,
  onRestore,
  onDeletePermanently,
  onToggleStar,
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

  if (isTrashMode) {
    return (
      <div className="relative inline-block">
        <button
          onClick={toggleMenu}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title="More options"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleAction(onRestore)}
                className={`${menuItemClass} text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Restore
              </button>
              <button
                onClick={() => handleAction(onDeletePermanently)}
                className={`${menuItemClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete permanently
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={toggleMenu}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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
            className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleAction(onOpen)}
              className={`${menuItemClass} text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700`}
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
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700`}
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
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700`}
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
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700`}
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

            {onShare && (
              <button
                onClick={() => handleAction(onShare)}
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700`}
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Share
              </button>
            )}

            {onToggleStar && (
              <button
                onClick={() => handleAction(onToggleStar)}
                className={`${menuItemClass} text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700`}
              >
                <svg
                  className={`h-4 w-4 text-amber-500 ${item?.isStarred ? "fill-amber-500" : ""}`}
                  fill={item?.isStarred ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.773-.565-.373-1.81.587-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z"
                  />
                </svg>
                {item?.isStarred ? "Remove star" : "Star item"}
              </button>
            )}

            <button
              onClick={() => handleAction(onRename)}
              className={`${menuItemClass} text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700`}
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

            <div className="my-1 border-t border-slate-100 dark:border-gray-700" />

            <button
              onClick={() => handleAction(onDelete)}
              className={`${menuItemClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30`}
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
