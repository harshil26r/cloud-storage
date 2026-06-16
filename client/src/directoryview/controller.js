import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { showSuccessToast, showErrorToast } from "../utils/toastConfig";
import {
  fetchDirectories,
  fetchSharedWithMe,
  createDir,
  updateDir,
  fetchTrashBin,
  emptyTrashBin,
  fetchStarredItems,
  fetchRecentFiles,
  fetchSearchResults,
} from "../store/directorySlice";
import { renameFileAction } from "../store/fileSlice";
import { makeGDriveOffline, uploadGDriveFile } from "../store/googleDriveSlice";
import { fetchProfile } from "../store/userSlice";
import axiosInstance from "../api/axiosInstance";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function useDirectoryViewController({
  isSharedMode = false,
  isTrashMode = false,
  isStarredMode = false,
  isRecentMode = false,
  isSearchMode = false,
}) {
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renamingItem, setRenamingItem] = useState(null);
  const [sharingItem, setSharingItem] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { directoryId } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

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
    } else if (isStarredMode) {
      dispatch(fetchStarredItems());
    } else if (isRecentMode) {
      dispatch(fetchRecentFiles());
    } else if (isSearchMode) {
      dispatch(fetchSearchResults(searchQuery));
    } else {
      dispatch(fetchDirectories(directoryId || ""));
    }
  }, [
    dispatch,
    directoryId,
    isSharedMode,
    isTrashMode,
    isStarredMode,
    isRecentMode,
    isSearchMode,
    searchQuery,
  ]);

  const handleToggleStar = useCallback(
    async (_id, isFile) => {
      try {
        const endpoint = `/${isFile ? "file" : "directory"}/${_id}/star`;
        const response = await axiosInstance.patch(endpoint);
        const isStarred = response.data.isStarred;
        showSuccessToast(
          isStarred ? "Starred successfully" : "Unstarred successfully",
        );
        getAllFiles();
      } catch (error) {
        showErrorToast(error.response?.data?.error || error.message);
      }
    },
    [getAllFiles],
  );

  const handleTrash = useCallback(
    async (_id, isFile) => {
      try {
        const endpoint = `/${isFile ? "file" : "directory"}/${_id}/trash`;
        await axiosInstance.patch(endpoint);
        showSuccessToast("Moved to Trash");
        getAllFiles();
        dispatch(fetchProfile());
      } catch (error) {
        showErrorToast(error.response?.data?.error || error.message);
      }
    },
    [getAllFiles, dispatch],
  );

  const handleRestore = useCallback(
    async (_id, isFile) => {
      try {
        const endpoint = `/${isFile ? "file" : "directory"}/${_id}/restore`;
        await axiosInstance.patch(endpoint);
        showSuccessToast("Restored successfully");
        getAllFiles();
        dispatch(fetchProfile());
      } catch (error) {
        showErrorToast(error.response?.data?.error || error.message);
      }
    },
    [getAllFiles, dispatch],
  );

  const handleDeletePermanently = useCallback(
    async (_id, isFile) => {
      if (
        !window.confirm(
          "Are you sure you want to permanently delete this? This cannot be undone.",
        )
      )
        return;
      try {
        const endpoint = `/${isFile ? "file" : "directory"}/${_id}/permanent`;
        await axiosInstance.delete(endpoint);
        showSuccessToast("Permanently deleted");
        getAllFiles();
        dispatch(fetchProfile());
      } catch (error) {
        showErrorToast(error.response?.data?.error || error.message);
      }
    },
    [getAllFiles, dispatch],
  );

  const handleEmptyTrash = async () => {
    if (
      !window.confirm(
        "Empty the trash bin? All items in the trash will be permanently deleted!",
      )
    )
      return;
    try {
      await dispatch(emptyTrashBin()).unwrap();
      showSuccessToast("Trash bin emptied");
      getAllFiles();
      dispatch(fetchProfile());
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

  const handleOpenFile = useCallback(
    (item) => {
      if (isTrashMode) {
        showErrorToast("Restore this file to preview it.");
        return;
      }
      window.open(getUrl(item._id, true) + "?action=open");
    },
    [isTrashMode],
  );

  const handleOpenFolder = useCallback(
    (_id) => {
      if (isTrashMode) {
        showErrorToast("Restore this folder to access its contents.");
      } else {
        navigate(getUrl(_id, false));
      }
    },
    [isTrashMode, navigate],
  );

  const handleDownloadFile = useCallback(
    (item) => {
      if (isTrashMode) {
        showErrorToast("Restore this file to download it.");
        return;
      }
      window.location.href = getUrl(item._id, true) + "?action=download";
    },
    [isTrashMode],
  );

  const handleMakeOffline = useCallback(
    async (item) => {
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
    },
    [dispatch, getAllFiles],
  );

  const handleOpenInDrive = useCallback((item) => {
    if (item.webViewLink) {
      window.open(item.webViewLink, "_blank");
    }
  }, []);

  const uploadFileInCurrentDir = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
          dispatch(fetchProfile());
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
          dispatch(fetchProfile());
        } else {
          showErrorToast(response.message || response.error);
        }
      } catch (parseError) {
        if (xhr.status >= 200 && xhr.status < 300) {
          showSuccessToast("File uploaded successfully!");
          getAllFiles();
          dispatch(fetchProfile());
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
      onToggleStar: () => handleToggleStar(item?._id, true),
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
      handleToggleStar,
    ],
  );

  useEffect(() => {
    getAllFiles();
  }, [getAllFiles]);

  const hasItems = fileList?.length > 0 || directoryList?.length > 0;

  return {
    newFileName,
    setNewFileName,
    newFolderName,
    setNewFolderName,
    showCreateFolder,
    setShowCreateFolder,
    renamingItem,
    setRenamingItem,
    sharingItem,
    setSharingItem,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    navigate,
    dispatch,
    directoryId,
    searchQuery,
    viewMode,
    directoryList,
    fileList,
    currentDir,
    loading,
    isGoogleDriveFolder,
    getAllFiles,
    handleToggleStar,
    handleTrash,
    handleRestore,
    handleDeletePermanently,
    handleEmptyTrash,
    handleRename,
    handleSaveFileName,
    handleOpenFile,
    handleOpenFolder,
    handleDownloadFile,
    handleMakeOffline,
    handleOpenInDrive,
    uploadFileInCurrentDir,
    createFolder,
    fileItemProps,
    hasItems,
    fetchProfile,
  };
}
