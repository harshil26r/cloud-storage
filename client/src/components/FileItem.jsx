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
}) {
  const [showActions, setShowActions] = useState(false);
  const modifiedDate = item?.modifiedAt || item?.modified;
  const isGoogleFile = !!item?.googleId;

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
        className="group relative flex flex-col rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md hover:border-gray-300 cursor-pointer dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:shadow-gray-900/50"
      >
        <div className="flex items-center justify-center aspect-[4/3] bg-gray-50 rounded-t-lg overflow-hidden dark:bg-gray-800">
          <FileThumbnail item={item} size="lg" />
        </div>
        <div className="px-3 py-2.5 flex items-center justify-between gap-1">
          <p className="text-sm text-gray-800 truncate flex-1 min-w-0 dark:text-gray-200">
            {item?.name}
          </p>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              isOpen={showActions}
              onToggle={() => setShowActions(!showActions)}
              onClose={() => setShowActions(false)}
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
      } dark:border-gray-800 dark:hover:bg-gray-800/50`}
    >
      <td className="px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <FileThumbnail item={item} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {item?.name}
            </span>
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
            onClose={() => setShowActions(false)}
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
          />
        </div>
      </td>
    </tr>
  );
}
