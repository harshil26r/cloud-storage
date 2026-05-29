import { useEffect, useRef } from "react";

export default function RenameDialog({
  isOpen,
  onSave,
  onCancel,
  onNameChange,
  name,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rename</h2>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter new name"
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
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
