import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BreadcrumbNav from "./components/BreadcrumbNav";
import FileItem from "./components/FileItem";
import FolderItem from "./components/FolderItem";
import ActionMenu from "./components/action/ActionMenu";
import EmptyState from "./components/EmptyState";
import FileThumbnail from "./components/FileThumbnail";
import RenameDialog from "./components/action/RenameDialog";
import CreateFolderDialog from "./components/action/CreateFolderDialog";
import ShareDialog from "./components/action/ShareDialog";
import { showSuccessToast, showErrorToast } from "./utils/toastConfig";
import {
  fetchDirectories,
  fetchSharedWithMe,
  createDir,
  updateDir,
  deleteDir,
  fetchTrashBin,
  emptyTrashBin,
} from "./store/directorySlice";
import { deleteSingleFile, renameFileAction } from "./store/fileSlice";
import {
  deleteGDriveFile,
  makeGDriveOffline,
  uploadGDriveFile,
} from "./store/googleDriveSlice";
import { GoogleDriveLogo } from "./components/GoogleDrive/icons";
import axiosInstance from "./api/axiosInstance";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function DirectoryView({ isSharedMode = false, isTrashMode = false }) {
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renamingItem, setRenamingItem] = useState(null);
  const [sharingItem, setSharingItem] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { directoryId } = useParams();

  // Redux Selectors
  const viewMode = useSelector((state) => state.ui.viewMode);
  const {
    directories: directoryList,
    files: fileList,
    currentDir,
    loading,
  } = useSelector((state) => state.directory);

  const isGoogleDriveFolder = !!currentDir?.googleId;

  const getAllFiles = useCallback(() => {
    if (isTrashMode) {
      dispatch(fetchTrashBin());
    } else if (isSharedMode) {
      dispatch(fetchSharedWithMe());
    } else {
      dispatch(fetchDirectories(directoryId || ""));
    }
  }, [dispatch, directoryId, isSharedMode, isTrashMode]);

  const handleTrash = useCallback(async (_id, isFile) => {
    try {
      const endpoint = `/${isFile ? "file" : "directory"}/${_id}/trash`;
      await axiosInstance.patch(endpoint);
      showSuccessToast("Moved to Trash");
      getAllFiles();
    } catch (error) {
      showErrorToast(error.response?.data?.error || error.message);
    }
  }, [getAllFiles]);

  const handleRestore = useCallback(async (_id, isFile) => {
    try {
      const endpoint = `/${isFile ? "file" : "directory"}/${_id}/restore`;
      await axiosInstance.patch(endpoint);
      showSuccessToast("Restored successfully");
      getAllFiles();
    } catch (error) {
      showErrorToast(error.response?.data?.error || error.message);
    }
  }, [getAllFiles]);

  const handleDeletePermanently = useCallback(async (_id, isFile) => {
    if (!window.confirm("Are you sure you want to permanently delete this? This cannot be undone.")) return;
    try {
      const endpoint = `/${isFile ? "file" : "directory"}/${_id}/permanent`;
      await axiosInstance.delete(endpoint);
      showSuccessToast("Permanently deleted");
      getAllFiles();
    } catch (error) {
      showErrorToast(error.response?.data?.error || error.message);
    }
  }, [getAllFiles]);

  const handleEmptyTrash = async () => {
    if (!window.confirm("Empty the trash bin? All items in the trash will be permanently deleted!")) return;
    try {
      await dispatch(emptyTrashBin()).unwrap();
      showSuccessToast("Trash bin emptied");
      getAllFiles();
    } catch (error) {
      showErrorToast(error || "Failed to empty trash");
    }
  };

  const handleRename = useCallback((oldFileName, _id, isFile) => {
    setNewFileName(oldFileName);
    setRenamingItem({ _id, isFile });
  }, []);

  const handleSaveFileName = async () => {
    if (!renamingItem || !newFileName.trim()) {
      showErrorToast("Please enter a valid name");
      return;
    }

    const { _id, isFile } = renamingItem;
    const newFile = `${newFileName.trim()}`;

    try {
      const result = isFile
        ? await dispatch(renameFileAction({ fileId: _id, newName: newFile }))
        : await dispatch(updateDir({ directoryId: _id, name: newFile }));

      if (!result.error) {
        showSuccessToast(result.payload.message);
        getAllFiles();
      } else {
        showErrorToast(result.payload || "Failed to rename");
      }
      setNewFileName("");
      setRenamingItem(null);
    } catch (error) {
      console.error("Error renaming:", error);
      showErrorToast(error.message);
    }
  };

  const getUrl = (_id, isFile) => {
    return `${isFile ? `${BASE_URL}file` : "/directory"}/${_id}`;
  };

  const handleOpenFile = useCallback((item) => {
    if (isTrashMode) {
      showErrorToast("Restore this file to preview it.");
      return;
    }
    window.open(getUrl(item._id, true) + "?action=open");
  }, [isTrashMode]);

  const handleOpenFolder = useCallback((_id) => {
    if (isTrashMode) {
      showErrorToast("Restore this folder to access its contents.");
    } else {
      navigate(getUrl(_id, false));
    }
  }, [isTrashMode, navigate]);

  const handleDownloadFile = useCallback((item) => {
    if (isTrashMode) {
      showErrorToast("Restore this file to download it.");
      return;
    }
    window.location.href = getUrl(item._id, true) + "?action=download";
  }, [isTrashMode]);

  const handleMakeOffline = useCallback(async (item) => {
    try {
      const result = await dispatch(makeGDriveOffline(item._id));
      if (!result.error) {
        showSuccessToast(result.payload.message);
        getAllFiles();
      } else {
        showErrorToast(result.payload || "Failed to make file offline");
      }
    } catch (error) {
      showErrorToast(error.message);
    }
  }, []);

  const handleOpenInDrive = useCallback((item) => {
    if (item.webViewLink) {
      window.open(item.webViewLink, "_blank");
    }
  }, []);

  const uploadFileInCurrentDir = async (e) => {
    const file = e.target.files[0];
    const parentId = directoryId || currentDir?._id;

    if (isGoogleDriveFolder) {
      const form = new FormData();
      form.append("file", file);
      form.append("parentDirId", parentId);

      try {
        const result = await dispatch(uploadGDriveFile(form));
        if (!result.error) {
          showSuccessToast(result.payload.message);
          getAllFiles();
        } else {
          showErrorToast(result.payload || "Upload failed");
        }
      } catch (error) {
        showErrorToast(error.message);
      }
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
          getAllFiles();
        } else {
          showErrorToast(response.message || response.error);
        }
      } catch (parseError) {
        if (xhr.status >= 200 && xhr.status < 300) {
          showSuccessToast("File uploaded successfully!");
          getAllFiles();
        } else {
          showErrorToast(`Failed to upload file : ${parseError}`);
        }
      }
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
      const result = await dispatch(
        createDir({
          name: newFolderName.trim(),
          parentDirId: directoryId || currentDir?._id,
        }),
      );

      if (!result.error) {
        showSuccessToast(result.payload.message);
        getAllFiles();
      } else {
        showErrorToast(result.payload || "Failed to create folder");
      }
      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      showErrorToast(error.message);
    }
  };

  const fileItemProps = useMemo(
    () => (item) => ({
      item,
      onOpen: () => handleOpenFile(item),
      onDownload: () => handleDownloadFile(item),
      onRename: () => handleRename(item?.name, item?._id, true),
      onDelete: () => handleTrash(item?._id, true),
      onMakeOffline: () => handleMakeOffline(item),
      onOpenInDrive: () => handleOpenInDrive(item),
      onStatusChange: getAllFiles,
      onShare: () =>
        setSharingItem({ _id: item._id, name: item.name, isFile: true }),
      isTrashMode,
      onRestore: () => handleRestore(item?._id, true),
      onDeletePermanently: () => handleDeletePermanently(item?._id, true),
    }),
    [
      handleOpenFile,
      handleDownloadFile,
      handleRename,
      handleTrash,
      handleMakeOffline,
      handleOpenInDrive,
      getAllFiles,
      isTrashMode,
      handleRestore,
      handleDeletePermanently,
    ],
  );

  useEffect(() => {
    getAllFiles();
  }, [getAllFiles]);

  const hasItems = fileList?.length > 0 || directoryList?.length > 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

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

              {isTrashMode ? (
                <button
                  onClick={handleEmptyTrash}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 transition-colors"
                >
                  Empty Trash
                </button>
              ) : !isSharedMode ? (
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
              ) : null}
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

            <ShareDialog
              isOpen={!!sharingItem}
              itemId={sharingItem?._id}
              isFile={sharingItem?.isFile}
              onClose={() => setSharingItem(null)}
              onShareSuccess={getAllFiles}
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
                            onOpen={() => handleOpenFolder(item?._id)}
                            onRename={() =>
                              handleRename(item?.name, item?._id, false)
                            }
                            onDelete={() => handleTrash(item?._id, false)}
                            onShare={() =>
                              setSharingItem({
                                _id: item._id,
                                name: item.name,
                                isFile: false,
                              })
                            }
                            onRestore={() => handleRestore(item._id, false)}
                            onDeletePermanently={() => handleDeletePermanently(item._id, false)}
                            isTrashMode={isTrashMode}
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
                        onOpen={() => handleOpenFolder(item?._id)}
                        onRename={() =>
                          handleRename(item?.name, item?._id, false)
                        }
                        onDelete={() => handleTrash(item?._id, false)}
                        onShare={() =>
                          setSharingItem({
                            _id: item._id,
                            name: item.name,
                            isFile: false,
                          })
                        }
                        onRestore={() => handleRestore(item._id, false)}
                        onDeletePermanently={() => handleDeletePermanently(item._id, false)}
                        isTrashMode={isTrashMode}
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

                {viewMode === "list" && (
                  <div className="md:hidden space-y-2">
                    {directoryList?.map((item) => (
                      <div
                        key={`dir-mobile-${item._id}`}
                        className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-gray-900 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleOpenFolder(item?._id)}
                          >
                            <svg
                              className="w-6 h-6 shrink-0 text-amber-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                                {item?.name}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {item?.googleId ? "Drive folder" : "Folder"}
                              </p>
                            </div>
                          </div>
                          <div
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionMenu
                              item={item}
                              isFile={false}
                              onOpen={() => handleOpenFolder(item?._id)}
                              onRename={() =>
                                handleRename(item?.name, item?._id, false)
                              }
                              onDelete={() => handleTrash(item?._id, false)}
                              onShare={() =>
                                setSharingItem({
                                  _id: item._id,
                                  name: item.name,
                                  isFile: false,
                                })
                              }
                              isTrashMode={isTrashMode}
                              onRestore={() => handleRestore(item._id, false)}
                              onDeletePermanently={() => handleDeletePermanently(item._id, false)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {fileList?.map((item) => (
                      <div
                        key={`file-mobile-${item._id}`}
                        className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-gray-900 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleOpenFile(item)}
                          >
                            <FileThumbnail item={item} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                                {item?.name}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {item?.googleId ? "Drive" : "File"}
                              </p>
                            </div>
                          </div>
                          <div
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionMenu
                              isFile={true}
                              {...fileItemProps(item)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DirectoryView;
