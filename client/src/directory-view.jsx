import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Header from "./components/Header";
import BreadcrumbNav from "./components/BreadcrumbNav";
import FileItem from "./components/FileItem";
import FolderItem from "./components/FolderItem";
import EmptyState from "./components/EmptyState";
import RenameDialog from "./components/action/RenameDialog";
import CreateFolderDialog from "./components/action/CreateFolderDialog";
import { showSuccessToast, showErrorToast } from "./utils/toastConfig";
import { deleteFile, renameFile } from "./api/fileAPI";
import {
  createDirectory,
  deleteDirectory,
  getDirectories,
  updateDirectory,
} from "./api/directoryAPI";
import {
  deleteGoogleFile,
  makeFileOffline,
  uploadToGoogleDrive,
} from "./api/googleDriveAPI";
import { GoogleDriveLogo } from "./components/GoogleDrive/icons";

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

  const isGoogleDriveFolder = !!currentDir?.googleId;

  const getAllFiles = useCallback(async () => {
    const { data, statusText } = await getDirectories(directoryId);
    if (statusText === "OK") {
      setFileList(data?.files);
      setDirectoryList(data?.directories);
      setCurrentDir(data);
    }
  }, [directoryId]);

  const handleDelete = async (_id, isFile, item) => {
    try {
      if (isFile && item?.googleId) {
        const deleteLocal =
          item.syncState === "offline" || item.storageMode === "offline";
        const confirmMsg = deleteLocal
          ? "Delete this file from Google Drive and remove the local copy?"
          : "Delete this file from Google Drive?";
        if (!window.confirm(confirmMsg)) return;

        const { data, statusText } = await deleteGoogleFile(_id, deleteLocal);
        if (statusText === "OK") {
          showSuccessToast(data.message);
        } else {
          showErrorToast(data.error || data.message);
        }
      } else {
        const { data, statusText } = isFile
          ? await deleteFile(_id)
          : await deleteDirectory(_id);

        if (statusText === "OK") {
          showSuccessToast(data.message);
        } else {
          showErrorToast(data.message || data.error);
        }
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
      const { data, statusText } = isFile
        ? await renameFile(_id, newFile)
        : await updateDirectory(_id, newFile);

      if (statusText === "OK") {
        showSuccessToast(data.message);
      } else {
        showErrorToast(data?.message || data?.error);
      }
      setNewFileName("");
      setRenamingItem(null);
      await getAllFiles();
    } catch (error) {
      console.error("Error renaming:", error);
      showErrorToast(error.message);
    }
  };

  const getUrl = (_id, isFile) => {
    return `${isFile ? `${BASE_URL}file` : "/directory"}/${_id}`;
  };

  const handleOpenFile = (item) => {
    window.open(getUrl(item._id, true) + "?action=open");
  };

  const handleDownloadFile = (item) => {
    window.location.href = getUrl(item._id, true) + "?action=download";
  };

  const handleMakeOffline = async (item) => {
    try {
      const { data, statusText } = await makeFileOffline(item._id);
      if (statusText === "OK" || statusText === "Accepted") {
        showSuccessToast(data.message);
        getAllFiles();
      } else {
        showErrorToast(data.error || "Failed to start download");
      }
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleOpenInDrive = (item) => {
    if (item.webViewLink) {
      window.open(item.webViewLink, "_blank");
    }
  };

  const uploadFileInCurrentDir = async (e) => {
    const file = e.target.files[0];
    const parentId = directoryId || currentDir?._id;

    if (isGoogleDriveFolder) {
      const form = new FormData();
      form.append("file", file);
      form.append("parentDirId", parentId);

      try {
        const { data, statusText } = await uploadToGoogleDrive(form);
        if (statusText === "Created") {
          showSuccessToast(data.message);
        } else {
          showErrorToast(data.error || "Upload failed");
        }
      } catch (error) {
        showErrorToast(error.message);
      }
      getAllFiles();
      e.target.value = "";
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("parentDirId", parentId);
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
    xhr.send(form);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      showErrorToast("Please enter a folder name");
      return;
    }
    try {
      const { data, statusText } = await createDirectory(
        newFolderName.trim(),
        directoryId || currentDir?._id,
      );
      if (statusText === "Created") {
        showSuccessToast(data.message);
      } else {
        showErrorToast(data.message || data.error);
      }
      setNewFolderName("");
      setShowCreateFolder(false);
      await getAllFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
      showErrorToast(error.message);
    }
  };

  const fileItemProps = (item) => ({
    item,
    onOpen: () => handleOpenFile(item),
    onDownload: () => handleDownloadFile(item),
    onRename: () => handleRename(item?.name, item?._id, true),
    onDelete: () => handleDelete(item?._id, true, item),
    onMakeOffline: () => handleMakeOffline(item),
    onOpenInDrive: () => handleOpenInDrive(item),
    onStatusChange: getAllFiles,
  });

  useEffect(() => {
    getAllFiles();
  }, [getAllFiles]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        viewMode={viewMode}
        onViewChange={setViewMode}
        onSyncComplete={getAllFiles}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {isGoogleDriveFolder && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 via-white to-amber-50 px-4 py-3 ring-1 ring-blue-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <GoogleDriveLogo className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                Browsing Google Drive
              </p>
              <p className="text-xs text-slate-500">
                Files here sync with your connected Google account
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BreadcrumbNav
            currentDir={currentDir}
            onBack={() => navigate(`/directory/${currentDir.parentDirId}`)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
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
              New folder
            </button>
            <label
              className={`inline-flex cursor-pointer items-center rounded-lg px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow ${
                isGoogleDriveFolder
                  ? "bg-[#1a73e8] hover:bg-[#1557b0]"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {isGoogleDriveFolder ? "Upload to Drive" : "Upload"}
              <input
                type="file"
                onChange={uploadFileInCurrentDir}
                className="hidden"
              />
            </label>
          </div>
        </div>

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
          itemName={renamingItem?.isFile ? newFileName : renamingItem?._id}
          name={newFileName}
          onNameChange={setNewFileName}
          onSave={handleSaveFileName}
          onCancel={() => {
            setNewFileName("");
            setRenamingItem(null);
          }}
        />

        {fileList?.length === 0 && directoryList?.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {viewMode === "list" && (
              <div className="hidden min-h-lvh overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
                <table className="w-full">
                  <thead className="border-b border-slate-100 bg-slate-50/80">
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
                        viewMode="list"
                        {...fileItemProps(item)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
                    viewMode="grid"
                    {...fileItemProps(item)}
                  />
                ))}
              </div>
            )}

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
                        <p className="text-xs text-gray-500">
                          {item?.googleId ? "Google Drive Folder" : "Folder"}
                        </p>
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
                        <p className="text-xs text-gray-500">
                          {item?.googleId ? "Google Drive" : "File"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenFile(item)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors text-center"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDownloadFile(item)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors text-center"
                    >
                      Download
                    </button>
                    {item?.googleId && item?.syncState === "online_only" && (
                      <button
                        onClick={() => handleMakeOffline(item)}
                        className="flex-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors text-center"
                      >
                        Offline
                      </button>
                    )}
                    <button
                      onClick={() => handleRename(item?.name, item?._id, true)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(item?._id, true, item)}
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
