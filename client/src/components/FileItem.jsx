import { useState } from "react";
import ActionMenu from "./action/ActionMenu";
import FileThumbnail from "./FileThumbnail";
import FileStatusIndicator from "./GoogleDrive/FileStatusIndicator";

export default function FileItem({
  item,
  viewMode,
  onOpen,
  onRename,
  onDelete,
  onMakeOffline,
  onOpenInDrive,
  onStatusChange,
  onShare,
  isTrashMode,
  onRestore,
  onDeletePermanently,
  onToggleStar,
}) {
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const isGoogleFile = !!item?.googleId;

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

  const initialState = isGoogleFile
    ? {
        syncState: item.syncState,
        storageMode: item.storageMode,
        downloadProgress: item.downloadProgress,
      }
    : null;
  if (viewMode === "grid") {
    return (
      <div
        onClick={onOpen}
        onContextMenu={handleContextMenu}
        className="group relative flex flex-col rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md hover:border-gray-300 cursor-pointer dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:shadow-gray-900/50"
      >
        <div className="flex items-center justify-center aspect-[4/3] bg-gray-50 rounded-t-lg overflow-hidden dark:bg-gray-800">
          <FileThumbnail item={item} size="lg" />
        </div>
        <div className="px-3 py-2.5 flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <p className="text-sm text-gray-800 truncate dark:text-gray-200">
              {item?.name}
            </p>
            {item?.isStarred && (
              <svg className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              isOpen={showActions}
              onToggle={() => setShowActions(!showActions)}
              onClose={handleClose}
              menuPosition={menuPosition}
              onRename={onRename}
              onDelete={onDelete}
              item={item}
              onMakeOffline={onMakeOffline}
              onOpenInDrive={onOpenInDrive}
              onStatusChange={onStatusChange}
              onShare={onShare}
              isTrashMode={isTrashMode}
              onRestore={onRestore}
              onDeletePermanently={onDeletePermanently}
              isFile={true}
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
      } dark:border-gray-800 dark:hover:bg-gray-800/50`}
    >
      <td className="px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <FileThumbnail item={item} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {item?.name}
              </span>
              {item?.isStarred && (
                <svg className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
            {isGoogleFile && (
              <FileStatusIndicator
                fileId={item._id}
                googleId={item.googleId}
                initialState={initialState}
                onStatusChange={onStatusChange}
              />
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-500 whitespace-nowrap sm:table-cell dark:text-gray-400">
        {item?.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : "—"}
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
            onClose={handleClose}
            menuPosition={menuPosition}
            onRename={onRename}
            onDelete={onDelete}
            item={item}
            onMakeOffline={onMakeOffline}
            onOpenInDrive={onOpenInDrive}
            onStatusChange={onStatusChange}
            onShare={onShare}
            isTrashMode={isTrashMode}
            onRestore={onRestore}
            onDeletePermanently={onDeletePermanently}
            isFile={true}
            onToggleStar={onToggleStar}
          />
        </div>
      </td>
    </tr>
  );
}
