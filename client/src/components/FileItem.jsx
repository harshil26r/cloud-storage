import ActionMenu from "./ActionMenu";

export default function FileItem({
  item,
  viewMode,
  onOpen,
  onDownload,
  onRename,
  onDelete,
}) {
  return viewMode === "grid" ? (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <svg
          className="w-10 h-10 text-blue-500 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
        <ActionMenu
          item={item}
          isFile={true}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
      <p className="text-sm font-medium text-gray-900 truncate mb-1 flex-1">
        {item?.name}
      </p>
      <p className="text-xs text-gray-500">
        {item?.modified ? new Date(item.modified).toLocaleDateString() : "-"}
      </p>
    </div>
  ) : (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-200">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-gray-900">
            {item?.name}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {item?.modified ? new Date(item.modified).toLocaleDateString() : "-"}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">File</td>
      <td className="px-6 py-4 text-center">
        <ActionMenu
          item={item}
          isFile={true}
          onOpen={onOpen}
          onDownload={onDownload}
          onRename={onRename}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
