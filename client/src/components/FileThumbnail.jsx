import { useState } from "react";
import { getFileIcon } from "../utils/fileIcons";
import { GoogleDriveLogo } from "./GoogleDrive/icons";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function FileThumbnail({ item, size = "sm" }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  if (item?.googleId && item?.syncState !== "offline") {
    return (
      <div className={`${sizes[size]} shrink-0 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30`}>
        <GoogleDriveLogo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const name = (item?.name || "").toLowerCase();
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot !== -1 ? name.substring(lastDot) : "";
  const mimeType = (item?.mimeType || "").toLowerCase();

  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".wmv", ".flv"];

  const hasThumbnail =
    !imgError &&
    (mimeType.startsWith("image/") ||
      imageExts.includes(ext) ||
      mimeType === "application/pdf" ||
      ext === ".pdf" ||
      mimeType.startsWith("video/") ||
      videoExts.includes(ext));

  if (hasThumbnail) {
    const imgSizeClass = size === "lg" ? "w-full h-full" : sizes[size];
    const roundedClass = size === "lg" ? "rounded-t-lg" : "rounded-lg";
    return (
      <img
        src={`${BASE_URL}file/thumbnail/${item._id}`}
        alt={item?.name || "thumbnail"}
        onError={() => setImgError(true)}
        className={`${imgSizeClass} shrink-0 ${roundedClass} object-cover`}
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
