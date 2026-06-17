import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import BreadcrumbNav from "../components/BreadcrumbNav";
import FileItem from "../components/FileItem";
import FolderItem from "../components/FolderItem";
import EmptyState from "../components/EmptyState";
import FileThumbnail from "../components/FileThumbnail";
import RenameDialog from "../components/action/RenameDialog";
import CreateFolderDialog from "../components/action/CreateFolderDialog";
import ShareDialog from "../components/action/ShareDialog";
import { GoogleDriveLogo } from "../components/GoogleDrive/icons";
import useDirectoryViewController from "./controller";
import ActionMenu from "../components/action/ActionMenu";

function DirectoryView({
  isSharedMode = false,
  isTrashMode = false,
  isStarredMode = false,
  isRecentMode = false,
  isSearchMode = false,
}) {
  const ctrl = useDirectoryViewController({
    isSharedMode,
    isTrashMode,
    isStarredMode,
    isRecentMode,
    isSearchMode,
  });

  if (ctrl.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header
        onSyncComplete={() => {
          ctrl.getAllFiles();
          ctrl.dispatch(ctrl.fetchProfile());
        }}
        onToggleMobileSidebar={() =>
          ctrl.setMobileSidebarOpen(!ctrl.mobileSidebarOpen)
        }
      />

      <div className="flex">
        <Sidebar
          currentDir={ctrl.currentDir}
          isOpen={ctrl.mobileSidebarOpen}
          onClose={() => ctrl.setMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {ctrl.isGoogleDriveFolder && (
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
                currentDir={ctrl.currentDir}
                onBack={() => {
                  if (ctrl.currentDir?.parentDirId) {
                    ctrl.navigate(`/directory/${ctrl.currentDir.parentDirId}`);
                  }
                }}
              />

              {isTrashMode ? (
                <button
                  onClick={ctrl.handleEmptyTrash}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 transition-colors"
                >
                  Empty Trash
                </button>
              ) : !isSharedMode &&
                !isStarredMode &&
                !isRecentMode &&
                !isSearchMode ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => ctrl.setShowCreateFolder(true)}
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
                      onChange={ctrl.uploadFileInCurrentDir}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <CreateFolderDialog
              isOpen={ctrl.showCreateFolder}
              name={ctrl.newFolderName}
              onNameChange={ctrl.setNewFolderName}
              onCreate={ctrl.createFolder}
              onCancel={() => {
                ctrl.setShowCreateFolder(false);
                ctrl.setNewFolderName("");
              }}
            />

            <RenameDialog
              isOpen={!!ctrl.renamingItem}
              itemName={
                ctrl.renamingItem?.isFile
                  ? ctrl.newFileName
                  : ctrl.renamingItem?._id
              }
              name={ctrl.newFileName}
              onNameChange={ctrl.setNewFileName}
              onSave={ctrl.handleSaveFileName}
              onCancel={() => {
                ctrl.setNewFileName("");
                ctrl.setRenamingItem(null);
              }}
            />

            <ShareDialog
              isOpen={!!ctrl.sharingItem}
              itemId={ctrl.sharingItem?._id}
              isFile={ctrl.sharingItem?.isFile}
              onClose={() => ctrl.setSharingItem(null)}
              onShareSuccess={ctrl.getAllFiles}
            />

            {!ctrl.hasItems ? (
              <EmptyState />
            ) : (
              <>
                {ctrl.viewMode === "list" && (
                  <div className="hidden overflow-visible md:block rounded-lg border border-gray-200 dark:border-gray-700">
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
                        {ctrl.directoryList?.map((item) => (
                          <FolderItem
                            key={`dir-${item._id}`}
                            item={item}
                            viewMode="list"
                            onOpen={() => ctrl.handleOpenFolder(item?._id)}
                            onRename={() =>
                              ctrl.handleRename(item?.name, item?._id, false)
                            }
                            onDelete={() => ctrl.handleTrash(item?._id, false)}
                            onShare={() =>
                              ctrl.setSharingItem({
                                _id: item._id,
                                name: item.name,
                                isFile: false,
                              })
                            }
                            onRestore={() =>
                              ctrl.handleRestore(item._id, false)
                            }
                            onDeletePermanently={() =>
                              ctrl.handleDeletePermanently(item._id, false)
                            }
                            isTrashMode={isTrashMode}
                            onToggleStar={() =>
                              ctrl.handleToggleStar(item?._id, false)
                            }
                          />
                        ))}
                        {ctrl.fileList?.map((item) => (
                          <FileItem
                            key={`file-${item._id}`}
                            viewMode="list"
                            {...ctrl.fileItemProps(item)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {ctrl.viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {ctrl.directoryList?.map((item) => (
                      <FolderItem
                        key={`dir-grid-${item._id}`}
                        item={item}
                        viewMode="grid"
                        onOpen={() => ctrl.handleOpenFolder(item?._id)}
                        onRename={() =>
                          ctrl.handleRename(item?.name, item?._id, false)
                        }
                        onDelete={() => ctrl.handleTrash(item?._id, false)}
                        onShare={() =>
                          ctrl.setSharingItem({
                            _id: item._id,
                            name: item.name,
                            isFile: false,
                          })
                        }
                        onRestore={() => ctrl.handleRestore(item._id, false)}
                        onDeletePermanently={() =>
                          ctrl.handleDeletePermanently(item._id, false)
                        }
                        isTrashMode={isTrashMode}
                        onToggleStar={() =>
                          ctrl.handleToggleStar(item?._id, false)
                        }
                      />
                    ))}
                    {ctrl.fileList?.map((item) => (
                      <FileItem
                        key={`file-grid-${item._id}`}
                        viewMode="grid"
                        {...ctrl.fileItemProps(item)}
                      />
                    ))}
                  </div>
                )}

                {ctrl.viewMode === "list" && (
                  <div className="md:hidden space-y-2">
                    {ctrl.directoryList?.map((item) => (
                      <div
                        key={`dir-mobile-${item._id}`}
                        className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-gray-900 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => ctrl.handleOpenFolder(item?._id)}
                          >
                            <svg
                              className="w-6 h-6 shrink-0 text-amber-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                                  {item?.name}
                                </p>
                                {item?.isStarred && (
                                  <svg
                                    className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
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
                              onOpen={() => ctrl.handleOpenFolder(item?._id)}
                              onRename={() =>
                                ctrl.handleRename(item?.name, item?._id, false)
                              }
                              onDelete={() =>
                                ctrl.handleTrash(item?._id, false)
                              }
                              onShare={() =>
                                ctrl.setSharingItem({
                                  _id: item._id,
                                  name: item.name,
                                  isFile: false,
                                })
                              }
                              isTrashMode={isTrashMode}
                              onRestore={() =>
                                ctrl.handleRestore(item._id, false)
                              }
                              onDeletePermanently={() =>
                                ctrl.handleDeletePermanently(item._id, false)
                              }
                              onToggleStar={() =>
                                ctrl.handleToggleStar(item?._id, false)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {ctrl.fileList?.map((item) => (
                      <div
                        key={`file-mobile-${item._id}`}
                        className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-gray-900 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => ctrl.handleOpenFile(item)}
                          >
                            <FileThumbnail item={item} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                                  {item?.name}
                                </p>
                                {item?.isStarred && (
                                  <svg
                                    className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
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
                              {...ctrl.fileItemProps(item)}
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
