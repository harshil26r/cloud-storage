import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

const BASE_URL = "http://localhost:4000/";

function DirectoryView() {
  const [fileList, setFileList] = useState([]);
  const [directoryList, setDirectoryList] = useState([]);
  const [newFileName, setNewFileName] = useState();
  const [currentDir, setCurrentDir] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const navigate = useNavigate();

  let { directoryId } = useParams();

  const navigateBack = () => {
    navigate(`/directory/${currentDir.parentDirId}`);
  };

  const handleDelete = async (id, isFile) => {
    const response = await fetch(
      `${BASE_URL}${isFile ? "file" : "directory"}/${id}`,
      {
        method: "DELETE",
      },
    );
    const data = await response.text();
    getAllFiles();
  };

  const handleRename = (oldFileName) => {
    setNewFileName(oldFileName);
  };

  const handleSaveFileName = async (oldFileName, id, isFile) => {
    setNewFileName(oldFileName);

    const newFile = `${newFileName.split(".")[0]}`;
    const response = await fetch(
      `${BASE_URL}${isFile ? "file" : "directory"}/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newName: newFile }),
      },
    );
    const data = await response.json();
    setNewFileName("");
    getAllFiles(directoryId);
  };

  const getAllFiles = async () => {
    const response = await fetch(
      `${BASE_URL}directory/${directoryId ? directoryId : ""}`,
      {
        method: "GET",
      },
    );
    const result = await response.json();
    setFileList(result?.files);

    setDirectoryList(result?.directories);
    setCurrentDir(result);
  };

  const getUrl = (id, isFile) => {
    return `${isFile ? `${BASE_URL}file` : "/directory"}/${id}`;
  };

  const uploadFileInCurrentDir = async (e) => {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}file/${file.name}`, true);
    xhr.setRequestHeader("filename", file.name);
    xhr.setRequestHeader("parentDirId", directoryId);
    xhr.addEventListener("load", () => {
      getAllFiles();
    });
    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;
      // setProgress(totalProgress.toFixed(2));
    });
    xhr.send(file);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}directory/${directoryId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dirName: newFolderName,
        }),
      });
      const data = await response.json();
      setNewFolderName("");
      setShowCreateFolder(false);
      getAllFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Error creating folder");
    }
  };

  useEffect(() => {
    getAllFiles();
  }, [directoryId]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h1 className="text-2xl font-semibold text-gray-900">My files</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            {currentDir.name !== "root" && (
              <button
                onClick={navigateBack}
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
            <span className="text-sm text-gray-500">
              {currentDir.name ? `📁 ${currentDir.name}` : "Root"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateFolder(!showCreateFolder)}
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
              + New
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

        {/* Create Folder Input */}
        {showCreateFolder && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Create New Folder
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                onChange={(e) => setNewFolderName(e.target.value)}
                value={newFolderName}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter folder name"
              />
              <button
                onClick={createFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rename Input */}
        {newFileName && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rename
            </label>
            <input
              type="text"
              onChange={(e) => setNewFileName(e.target.value)}
              value={newFileName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new file name"
            />
          </div>
        )}

        {/* Files List - Table for Desktop, Cards for Mobile */}
        {fileList?.length === 0 && directoryList?.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading a file.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto bg-white border border-gray-200 rounded-lg">
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
                <tbody className="divide-y divide-gray-200">
                  {/* Directories */}
                  {directoryList?.map((item, index) => (
                    <tr
                      onDoubleClick={() => navigate(getUrl(item?.id, false))}
                      key={`dir-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <svg
                            className="w-5 h-5 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">
                            {item?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item?.modified
                          ? new Date(item.modified).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Folder
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => navigate(getUrl(item?.id, false))}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            title="Open"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRename(item?.name)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 transition-colors"
                            title="Rename"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item?.id, false)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Files */}
                  {fileList?.map((item, index) => (
                    <tr
                      onDoubleClick={() => getUrl(item?.id, true)}
                      key={`file-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
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
                        {item?.modified
                          ? new Date(item.modified).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">File</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2">
                          <a
                            href={`${getUrl(item?.id, true)}?action=open`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            title="Open"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </a>
                          <a
                            href={`${getUrl(item?.id, true)}?action=download`}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                            title="Download"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleRename(item?.name)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 transition-colors"
                            title="Rename"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item?.id, true)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {/* Directories */}
              {directoryList?.map((item, index) => (
                <div
                  key={`dir-mobile-${index}`}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-6 h-6 text-yellow-500 flex-shrink-0"
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
                      onClick={() => navigate(getUrl(item?.id, false))}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleRename(item?.name)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(item?.id, false)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {/* Files */}
              {fileList?.map((item, index) => (
                <div
                  key={`file-mobile-${index}`}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-6 h-6 text-blue-500 flex-shrink-0"
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
                    <a
                      href={`${getUrl(item?.id, true)}?action=open`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors text-center"
                    >
                      Open
                    </a>
                    <a
                      href={`${getUrl(item?.id, true)}?action=download`}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors text-center"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleRename(item?.name)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(item?.id, true)}
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
