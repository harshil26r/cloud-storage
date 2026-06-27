import { useState } from "react";
import ActionMenu from "./action/ActionMenu";

export default function FolderItem({
  item,
  viewMode,
  onOpen,
  onRename,
  onDelete,
  onShare,
}) {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === "grid") {
    return (
      <div
        onClick={onOpen}
        className="group relative flex flex-col rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md hover:border-gray-300 cursor-pointer dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:shadow-gray-900/50"
      >
        <div className="flex items-center justify-center aspect-[4/3] bg-amber-50/40 rounded-t-lg overflow-hidden dark:bg-amber-900/20">
          <svg
            className="h-16 w-16 text-amber-400 dark:text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </div>
        <div className="px-3 py-2.5 flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-800 truncate dark:text-gray-200">
              {item?.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {item?.googleId ? "Google Drive" : "Folder"}
            </p>
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              isOpen={showActions}
              onToggle={() => setShowActions(!showActions)}
              onClose={() => setShowActions(false)}
              onRename={onRename}
              onDelete={onDelete}
              onShare={onShare}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr
      onClick={onOpen}
      className={`group border-b border-gray-100 transition-colors cursor-pointer ${
        showActions ? "bg-gray-50" : "hover:bg-gray-50"
      } dark:border-gray-800 dark:hover:bg-gray-800/50 dark:${showActions ? "bg-gray-800/30" : ""}`}
    >
      <td className="px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <svg
            className="h-6 w-6 shrink-0 text-amber-400 dark:text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
            {item?.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-500 whitespace-nowrap sm:table-cell dark:text-gray-400">
        —
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
        {item?.updatedAt
          ? new Date(item.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="px-4 py-2.5 text-right">
        <div
          className={`transition-opacity ${showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ActionMenu
            isOpen={showActions}
            onToggle={() => setShowActions(!showActions)}
            onClose={() => setShowActions(false)}
            onRename={onRename}
            onDelete={onDelete}
            onShare={onShare}
          />
        </div>
      </td>
    </tr>
  );
}
