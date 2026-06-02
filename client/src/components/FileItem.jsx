import ActionMenu from "./action/ActionMenu";
import FileStatusIndicator from "./GoogleDrive/FileStatusIndicator";
import { FileDriveIcon } from "./GoogleDrive/icons";

export default function FileItem({
  item,
  viewMode,
  onOpen,
  onDownload,
  onRename,
  onDelete,
  onMakeOffline,
  onOpenInDrive,
  onStatusChange,
}) {
  const modifiedDate = item?.modifiedAt || item?.modified;
  const isGoogleFile = !!item?.googleId;

  const initialState = isGoogleFile
    ? {
        syncState: item.syncState,
        storageMode: item.storageMode,
        downloadProgress: item.downloadProgress,
      }
    : null;

  return viewMode === "grid" ? (
    <div
      className={`group relative flex flex-col rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
        isGoogleFile
          ? "border-blue-100 hover:border-blue-200"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {isGoogleFile && (
        <div className="absolute right-3 top-3">
          <FileStatusIndicator
            fileId={item._id}
            googleId={item.googleId}
            initialState={initialState}
            compact
            onStatusChange={onStatusChange}
          />
        </div>
      )}

      <div className="mb-3 flex items-start justify-between">
        {isGoogleFile ? (
          <FileDriveIcon className="h-10 w-10 shrink-0" />
        ) : (
          <svg
            className="h-10 w-10 shrink-0 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <ActionMenu
          item={item}
          isFile={true}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
          onMakeOffline={onMakeOffline}
          onOpenInDrive={onOpenInDrive}
        />
      </div>

      <p className="mb-1 flex-1 truncate text-sm font-medium text-slate-900">
        {item?.name}
      </p>

      {!isGoogleFile && <p className="text-xs text-slate-400">Local file</p>}

      <p className="mt-1 text-xs text-slate-400">
        {modifiedDate ? new Date(modifiedDate).toLocaleDateString() : "—"}
      </p>
    </div>
  ) : (
    <tr
      className={`border-b transition-colors ${
        isGoogleFile ? "hover:bg-blue-50/40" : "hover:bg-slate-50"
      }`}
    >
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          {isGoogleFile ? (
            <FileDriveIcon className="h-5 w-5 shrink-0" />
          ) : (
            <svg
              className="h-5 w-5 shrink-0 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-900">
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
      <td className="px-6 py-3.5 text-sm text-slate-500">
        {modifiedDate ? new Date(modifiedDate).toLocaleDateString() : "—"}
      </td>
      <td className="px-6 py-3.5">
        {isGoogleFile ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 ring-inset">
            Drive
          </span>
        ) : (
          <span className="text-sm text-slate-500">Local</span>
        )}
      </td>
      <td className="px-6 py-3.5 text-center">
        <ActionMenu
          item={item}
          isFile={true}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
          onMakeOffline={onMakeOffline}
          onOpenInDrive={onOpenInDrive}
        />
      </td>
    </tr>
  );
}
