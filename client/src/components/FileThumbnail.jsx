import { getFileIcon } from "../utils/fileIcons";
import { GoogleDriveLogo } from "./GoogleDrive/icons";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function FileThumbnail({ item, size = "sm" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  if (item?.googleId) {
    return (
      <div className={`${sizes[size]} shrink-0 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30`}>
        <GoogleDriveLogo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (item?.thumbnailAvailable) {
    return (
      <img
        src={`${BASE_URL}file/thumbnail/${item._id}`}
        alt={item?.name || "thumbnail"}
        className={`${sizes[size]} shrink-0 rounded-lg object-cover`}
      />
    );
  }

  const fileIcon = getFileIcon(item?.name);

  return (
    <div
      className={`${sizes[size]} shrink-0 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800`}
    >
      {fileIcon}
    </div>
  );
}
