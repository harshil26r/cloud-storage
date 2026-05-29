import { useEffect, useRef } from "react";

export default function CreateFolderDialog({
  isOpen,
  onCreate,
  onCancel,
  onNameChange,
  name,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onCreate();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Create New Folder
        </h2>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter folder name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
