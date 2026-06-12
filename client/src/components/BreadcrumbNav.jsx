export default function BreadcrumbNav({ currentDir, onBack }) {
  return (
    <div className="flex items-center gap-1 min-w-0">
      {currentDir?._id && currentDir?._id !== currentDir?.parentDirId && (
        <button
          onClick={onBack}
          className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {currentDir?.path?.length > 0 ? (
        <>
          {currentDir.path.map((segment, index) => (
            <div key={index} className="flex items-center gap-1 min-w-0">
              <svg
                className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                {segment}
              </span>
            </div>
          ))}
          {currentDir?.name && (
            <div className="flex items-center gap-1 min-w-0">
              <svg
                className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
                {currentDir.name}
              </span>
            </div>
          )}
        </>
      ) : (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {currentDir?.name || "My Drive"}
        </span>
      )}
    </div>
  );
}
