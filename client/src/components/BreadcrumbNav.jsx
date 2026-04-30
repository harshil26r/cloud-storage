import { useNavigate } from "react-router";

export default function BreadcrumbNav({ currentDir, onBack }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center space-x-2">
      {currentDir?.name !== "root" && (
        <button
          onClick={onBack}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>
      )}
      <span className="text-sm text-gray-500 hidden sm:inline">
        {currentDir?.name ? `📁 ${currentDir.name}` : "Root"}
      </span>
    </div>
  );
}
