import ActionMenu from "./action/ActionMenu";
import { FolderDriveIcon } from "./GoogleDrive/icons";

export default function FolderItem({
  item,
  viewMode,
  onOpen,
  onRename,
  onDelete,
}) {
  const isGoogleFolder = !!item?.googleId;
  const modifiedDate = item?.modifiedAt || item?.modified;

  return viewMode === "grid" ? (
    <div
      className={`group flex cursor-pointer flex-col rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
        isGoogleFolder
          ? "border-amber-100 hover:border-amber-200"
          : "border-slate-200 hover:border-slate-300"
      }`}
      onDoubleClick={onOpen}
    >
      <div className="mb-3 flex items-start justify-between">
        {isGoogleFolder ? (
          <FolderDriveIcon className="h-10 w-10 shrink-0" />
        ) : (
          <svg
            className="h-10 w-10 shrink-0 text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        )}
        <ActionMenu
          item={item}
          isFile={false}
          onOpen={onOpen}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
      <p className="mb-1 flex-1 truncate text-sm font-medium text-slate-900">
        {item?.name}
      </p>
      <p className="text-xs text-slate-400">
        {isGoogleFolder ? "Google Drive" : "Folder"}
      </p>
    </div>
  ) : (
    <tr
      onDoubleClick={onOpen}
      className={`cursor-pointer border-b transition-colors ${
        isGoogleFolder ? "hover:bg-amber-50/40" : "hover:bg-slate-50"
      }`}
    >
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          {isGoogleFolder ? (
            <FolderDriveIcon className="h-5 w-5 shrink-0" />
          ) : (
            <svg
              className="h-5 w-5 shrink-0 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          )}
          <span className="text-sm font-medium text-slate-900">
            {item?.name}
          </span>
        </div>
      </td>
      <td className="px-6 py-3.5 text-sm text-slate-500">
        {modifiedDate ? new Date(modifiedDate).toLocaleDateString() : "—"}
      </td>
      <td className="px-6 py-3.5">
        {isGoogleFolder ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 ring-inset">
            Drive
          </span>
        ) : (
          <span className="text-sm text-slate-500">Folder</span>
        )}
      </td>
      <td className="px-6 py-3.5 text-center">
        <ActionMenu
          item={item}
          isFile={false}
          onOpen={onOpen}
          onRename={onRename}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
