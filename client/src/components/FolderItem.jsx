import { useState } from "react";
import ActionMenu from "./action/ActionMenu";

export default function FolderItem({
  item,
  viewMode,
  onOpen,
  onRename,
  onDelete,
  onShare,
  isTrashMode,
  onRestore,
  onDeletePermanently,
  onToggleStar,
}) {
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowActions(true);
  };

  const handleClose = () => {
    setShowActions(false);
    setMenuPosition(null);
  };

  if (viewMode === "grid") {
    return (
      <div
        onClick={onOpen}
        onContextMenu={handleContextMenu}
        className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-200 cursor-pointer dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:shadow-gray-950/50"
      >
        <div className="flex items-center justify-center aspect-[4/3] bg-amber-50/20 rounded-t-2xl overflow-hidden transition-all group-hover:bg-amber-50/40 dark:bg-amber-900/10 dark:group-hover:bg-amber-900/20">
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
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm text-gray-800 truncate dark:text-gray-200">
                {item?.name}
              </p>
              {item?.isStarred && (
                <svg className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {item?.googleId ? "Google Drive" : "Folder"}
            </p>
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
            <ActionMenu
              isOpen={showActions}
              onToggle={() => setShowActions(!showActions)}
              onClose={handleClose}
              menuPosition={menuPosition}
              onRename={onRename}
              onDelete={onDelete}
              onShare={onShare}
              isTrashMode={isTrashMode}
              onRestore={onRestore}
              onDeletePermanently={onDeletePermanently}
              item={item}
              isFile={false}
              onToggleStar={onToggleStar}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr
      onClick={onOpen}
      onContextMenu={handleContextMenu}
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
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
              {item?.name}
            </span>
            {item?.isStarred && (
              <svg className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
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
          onContextMenu={(e) => e.stopPropagation()}
        >
          <ActionMenu
            isOpen={showActions}
            onToggle={() => setShowActions(!showActions)}
            onClose={handleClose}
            menuPosition={menuPosition}
            onRename={onRename}
            onDelete={onDelete}
            onShare={onShare}
            isTrashMode={isTrashMode}
            onRestore={onRestore}
            onDeletePermanently={onDeletePermanently}
            item={item}
            isFile={false}
            onToggleStar={onToggleStar}
          />
        </div>
      </td>
    </tr>
  );
}
