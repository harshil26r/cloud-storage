import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Header from "./components/Header";
import BreadcrumbNav from "./components/BreadcrumbNav";
import FileItem from "./components/FileItem";
import FolderItem from "./components/FolderItem";
import EmptyState from "./components/EmptyState";
import RenameDialog from "./components/RenameDialog";
import CreateFolderDialog from "./components/CreateFolderDialog";
import { showSuccessToast, showErrorToast } from "./utils/toastConfig";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function DirectoryView() {
  const [fileList, setFileList] = useState([]);
  const [directoryList, setDirectoryList] = useState([]);
  const [newFileName, setNewFileName] = useState("");
  const [currentDir, setCurrentDir] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renamingItem, setRenamingItem] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const navigate = useNavigate();

  let { directoryId } = useParams();

  const handleDelete = async (_id, isFile) => {
    try {
      const response = await fetch(
        `${BASE_URL}${isFile ? "file" : "directory"}/${_id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (response.ok) {
        showSuccessToast(data.message);
      } else {
        showErrorToast(data.message || data.error);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      showErrorToast(error.message);
    }
    getAllFiles();
  };

  const handleRename = (oldFileName, _id, isFile) => {
    setNewFileName(oldFileName);
    setRenamingItem({ _id, isFile });
  };

  const handleSaveFileName = async () => {
    if (!renamingItem || !newFileName.trim()) {
      showErrorToast("Please enter a valid name");
      return;
    }

    const { _id, isFile } = renamingItem;
    const newFile = `${newFileName.trim()}`;

    try {
      const response = await fetch(
        `${BASE_URL}${isFile ? "file" : "directory"}/${_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newName: newFile }),
          credentials: "include",
        },
      );
      const data = await response.json();
      if (response.ok) {
        showSuccessToast(data.message);
      } else {
        showErrorToast(data.message || data.error);
      }
      setNewFileName("");
      setRenamingItem(null);
      getAllFiles(directoryId);
    } catch (error) {
      console.error("Error renaming:", error);
      showErrorToast(error.message);
    }
  };

  const getAllFiles = async () => {
    const response = await fetch(
      `${BASE_URL}directory/${directoryId ? directoryId : ""}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    const result = await response.json();
    setFileList(result?.files);
    setDirectoryList(result?.directories);
    setCurrentDir(result);
  };

  const getUrl = (_id, isFile) => {
    return `${isFile ? `${BASE_URL}file` : "/directory"}/${_id}`;
  };

  const uploadFileInCurrentDir = async (e) => {
    const file = e.target.files[0];
    const form = new FormData();
    form.append("file", file);
    form.append("parentDirId", directoryId || currentDir?._id);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}file/`, true);
    xhr.withCredentials = true;
    xhr.addEventListener("load", () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          showSuccessToast(response.message);
        } else {
          showErrorToast(response.message || response.error);
        }
      } catch (parseError) {
        if (xhr.status >= 200 && xhr.status < 300) {
          showSuccessToast("File uploaded successfully!");
        } else {
          showErrorToast(`Failed to upload file : ${parseError}`);
        }
      }
      getAllFiles();
      e.target.value = "";
    });
    xhr.addEventListener("error", () => {
      showErrorToast("Upload error occurred");
    });
    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;
      console.log(totalProgress);
    });
    xhr.send(form);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      showErrorToast("Please enter a folder name");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}directory/${directoryId || currentDir?._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dirName: newFolderName,
          }),
          credentials: "include",
        },
      );
      const data = await response.json();
      if (response.ok) {
        showSuccessToast(data.message);
      } else {
        showErrorToast(data.message || data.error);
      }
      setNewFolderName("");
      setShowCreateFolder(false);
      getAllFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
      showErrorToast(error.message);
    }
  };

  useEffect(() => {
    getAllFiles();
  }, [directoryId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header viewMode={viewMode} onViewChange={setViewMode} />

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <BreadcrumbNav
            currentDir={currentDir}
            onBack={() => navigate(`/directory/${currentDir.parentDirId}`)}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Folder
            </button>
            <label className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload
              <input
                type="file"
                onChange={uploadFileInCurrentDir}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Dialogs */}
        <CreateFolderDialog
          isOpen={showCreateFolder}
          name={newFolderName}
          onNameChange={setNewFolderName}
          onCreate={createFolder}
          onCancel={() => {
            setShowCreateFolder(false);
            setNewFolderName("");
          }}
        />

        <RenameDialog
          isOpen={!!renamingItem}
          itemName={renamingItem?._id}
          name={newFileName}
          onNameChange={setNewFileName}
          onSave={handleSaveFileName}
          onCancel={() => {
            setNewFileName("");
            setRenamingItem(null);
          }}
        />

        {/* Content Area */}
        {fileList?.length === 0 && directoryList?.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* List View - Desktop */}
            {viewMode === "list" && (
              <div className="hidden md:block overflow-x-auto min-h-lvh bg-white border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Modified
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {directoryList?.map((item, index) => (
                      <FolderItem
                        key={`dir-${index}`}
                        item={item}
                        viewMode="list"
                        onOpen={() => navigate(getUrl(item?._id, false))}
                        onRename={() =>
                          handleRename(item?.name, item?._id, false)
                        }
                        onDelete={() => handleDelete(item?._id, false)}
                      />
                    ))}
                    {fileList?.map((item, index) => (
                      <FileItem
                        key={`file-${index}`}
                        item={item}
                        viewMode="list"
                        onOpen={() =>
                          window.open(getUrl(item?._id, true) + "?action=open")
                        }
                        onDownload={() =>
                          (window.location.href =
                            getUrl(item?._id, true) + "?action=download")
                        }
                        onRename={() =>
                          handleRename(item?.name, item?._id, true)
                        }
                        onDelete={() => handleDelete(item?._id, true)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {directoryList?.map((item, index) => (
                  <FolderItem
                    key={`dir-grid-${index}`}
                    item={item}
                    viewMode="grid"
                    onOpen={() => navigate(getUrl(item?._id, false))}
                    onRename={() => handleRename(item?.name, item?._id, false)}
                    onDelete={() => handleDelete(item?._id, false)}
                  />
                ))}
                {fileList?.map((item, index) => (
                  <FileItem
                    key={`file-grid-${index}`}
                    item={item}
                    viewMode="grid"
                    onOpen={() =>
                      window.open(getUrl(item?._id, true) + "?action=open")
                    }
                    onDownload={() =>
                      (window.location.href =
                        getUrl(item?._id, true) + "?action=download")
                    }
                    onRename={() => handleRename(item?.name, item?._id, true)}
                    onDelete={() => handleDelete(item?._id, true)}
                  />
                ))}
              </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {directoryList?.map((item, index) => (
                <div
                  key={`dir-mobile-${index}`}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                  onDoubleClick={() => navigate(getUrl(item?._id, false))}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-6 h-6 text-yellow-500 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item?.name}
                        </p>
                        <p className="text-xs text-gray-500">Folder</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(getUrl(item?._id, false))}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleRename(item?.name, item?._id, false)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(item?._id, false)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {fileList?.map((item, index) => (
                <div
                  key={`file-mobile-${index}`}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-6 h-6 text-blue-500 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item?.name}
                        </p>
                        <p className="text-xs text-gray-500">File</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        window.open(getUrl(item?._id, true) + "?action=open")
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors text-center"
                    >
                      Open
                    </button>
                    <button
                      onClick={() =>
                        (window.location.href =
                          getUrl(item?._id, true) + "?action=download")
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors text-center"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleRename(item?.name, item?._id, true)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(item?._id, true)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default DirectoryView;
