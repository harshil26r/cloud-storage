import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useUI } from "./contexts/UIContext";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BreadcrumbNav from "./components/BreadcrumbNav";
import FileItem from "./components/FileItem";
import FolderItem from "./components/FolderItem";
import EmptyState from "./components/EmptyState";
import FileThumbnail from "./components/FileThumbnail";
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
  const { viewMode } = useUI();
  const navigate = useNavigate();

  const { directoryId } = useParams();

  const isGoogleDriveFolder = !!currentDir?.googleId;

  const getAllFiles = useCallback(async (signal) => {
    const { data, statusText } = await getDirectories(directoryId, { signal });
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
      } else if (!isFile && item?.googleId) {
        const isVirtualRoot = item.googleId === "root";
        const confirmMsg = isVirtualRoot
          ? "Remove the Google Drive folder from this app? Your files will stay in Google Drive."
          : "Delete this folder and all its contents from Google Drive?";
        if (!window.confirm(confirmMsg)) return;

        const { data, statusText } = await deleteDirectory(_id);
        if (statusText === "OK") {
          showSuccessToast(data.message);
        } else {
          showErrorToast(data.message || data.error);
        }
      } else {
        const confirmMsg = isFile
          ? "Delete this file?"
          : "Delete this folder and everything inside it?";
        if (!window.confirm(confirmMsg)) return;

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

  const fileItemProps = useMemo(() => (item) => ({
    item,
    onOpen: () => handleOpenFile(item),
    onDownload: () => handleDownloadFile(item),
    onRename: () => handleRename(item?.name, item?._id, true),
    onDelete: () => handleDelete(item?._id, true, item),
    onMakeOffline: () => handleMakeOffline(item),
    onOpenInDrive: () => handleOpenInDrive(item),
    onStatusChange: getAllFiles,
  }), [handleOpenFile, handleDownloadFile, handleRename, handleDelete, handleMakeOffline, handleOpenInDrive, getAllFiles]);

  useEffect(() => {
    const controller = new AbortController();
    getAllFiles(controller.signal);
    return () => controller.abort();
  }, [getAllFiles]);

  const hasItems = fileList?.length > 0 || directoryList?.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header onSyncComplete={getAllFiles} />

      <div className="flex">
        <Sidebar currentDir={currentDir} />

        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {isGoogleDriveFolder && (
              <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-blue-50/60 px-3.5 py-2.5 dark:bg-blue-900/30">
                <GoogleDriveLogo className="h-4 w-4 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Browsing Google Drive &mdash; files sync with your connected
                  account
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <BreadcrumbNav
                currentDir={currentDir}
                onBack={() => navigate(`/directory/${currentDir.parentDirId}`)}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <svg
                    className="h-4 w-4"
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
                <label className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 cursor-pointer transition-colors">
                  <svg
                    className="h-4 w-4"
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

            {!hasItems ? (
              <EmptyState />
            ) : (
              <>
                {viewMode === "list" && (
                  <div className="hidden overflow-x-auto md:block rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:table-cell dark:text-gray-400">
                            Size
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                            Modified
                          </th>
                          <th className="px-4 py-3 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {directoryList?.map((item) => (
                          <FolderItem
                            key={`dir-${item._id}`}
                            item={item}
                            viewMode="list"
                            onOpen={() => navigate(getUrl(item?._id, false))}
                            onRename={() =>
                              handleRename(item?.name, item?._id, false)
                            }
                            onDelete={() => handleDelete(item?._id, false)}
                          />
                        ))}
                        {fileList?.map((item) => (
                          <FileItem
                            key={`file-${item._id}`}
                            viewMode="list"
                            {...fileItemProps(item)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {directoryList?.map((item) => (
                      <FolderItem
                        key={`dir-grid-${item._id}`}
                        item={item}
                        viewMode="grid"
                        onOpen={() => navigate(getUrl(item?._id, false))}
                        onRename={() =>
                          handleRename(item?.name, item?._id, false)
                        }
                        onDelete={() => handleDelete(item?._id, false)}
                      />
                    ))}
                    {fileList?.map((item) => (
                      <FileItem
                        key={`file-grid-${item._id}`}
                        viewMode="grid"
                        {...fileItemProps(item)}
                      />
                    ))}
                  </div>
                )}

                <div className="md:hidden space-y-2">
                  {directoryList?.map((item) => (
                    <div
                      key={`dir-mobile-${item._id}`}
                      className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-gray-900 dark:border-gray-700"
                      onDoubleClick={() => navigate(getUrl(item?._id, false))}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 shrink-0 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                            {item?.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {item?.googleId ? "Drive folder" : "Folder"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {fileList?.map((item) => (
                    <div
                      key={`file-mobile-${item._id}`}
                      className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-gray-900 dark:border-gray-700"
                      onDoubleClick={() => handleOpenFile(item)}
                    >
                      <div className="flex items-center gap-3">
                        <FileThumbnail item={item} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                            {item?.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {item?.googleId ? "Drive" : "File"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DirectoryView;
