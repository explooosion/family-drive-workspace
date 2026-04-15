import { useState } from "react";
import {
  MdFolder,
  MdImage,
  MdVideoLibrary,
  MdPictureAsPdf,
  MdInsertDriveFile,
  MdMoreVert,
} from "react-icons/md";

import type { DriveFile } from "../types";
import { getThumbnailUrl, isFolderMime, isImageMime } from "../services/google_drive";
import { useAuthStore } from "../stores/auth_store";

type Props = {
  files: DriveFile[];
  selected: Set<string>;
  selectionMode: boolean;
  onOpen: (file: DriveFile) => void;
  onSelect: (fileId: string) => void;
  onMenuOpen?: (file: DriveFile) => void;
};

function formatKB(bytes?: string): string {
  if (!bytes) return "—";
  return `${(parseInt(bytes, 10) / 1024).toFixed(1)} KB`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 詳細清單 – 所有欄位在所有螢幕寬度下均可見（overflow-x-auto 支援橫向捲動）
export function GalleryDetail({
  files,
  selected,
  selectionMode,
  onOpen,
  onSelect,
  onMenuOpen,
}: Props) {
  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-gray-200 text-left text-base font-semibold tracking-wide text-gray-400 uppercase dark:border-gray-700 dark:text-gray-500">
              {selectionMode && <th className="w-8 px-3 py-3" />}
              <th className="w-8 px-3 py-3" />
              <th className="min-w-[140px] px-3 py-3">名稱</th>
              <th className="min-w-[100px] px-3 py-3">建立日期</th>
              <th className="min-w-[80px] px-3 py-3 text-right">大小</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <DetailRow
                key={file.id}
                file={file}
                isSelected={selected.has(file.id)}
                selectionMode={selectionMode}
                onOpen={onOpen}
                onSelect={onSelect}
                onMenuOpen={onMenuOpen}
              />
            ))}
          </tbody>
        </table>
      </div>
      <ListFooter />
    </>
  );
}

function ListFooter() {
  return (
    <div className="py-12 text-center text-base text-gray-400 dark:text-gray-600">
      已經滑到最底囉！
    </div>
  );
}

function DetailRow({
  file,
  isSelected,
  selectionMode,
  onOpen,
  onSelect,
  onMenuOpen,
}: {
  file: DriveFile;
  isSelected: boolean;
  selectionMode: boolean;
  onOpen: (file: DriveFile) => void;
  onSelect: (fileId: string) => void;
  onMenuOpen?: (file: DriveFile) => void;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isFolder = isFolderMime(file.mimeType);
  const isImage = isImageMime(file.mimeType);
  const isVideo = file.mimeType.startsWith("video/");
  const hasThumbnail = (isImage || isVideo) && !!accessToken;
  const thumbnailSrc = hasThumbnail ? getThumbnailUrl(file, accessToken) : "";

  return (
    <tr
      className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800/50 dark:active:bg-gray-800 ${
        isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
      }`}
      onClick={() => (selectionMode ? (isFolder ? undefined : onSelect(file.id)) : onOpen(file))}
      onContextMenu={(e) => e.preventDefault()}
    >
      {selectionMode && (
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(file.id)}
            onClick={(e) => e.stopPropagation()}
            className="accent-primary-600 h-4 w-4"
          />
        </td>
      )}
      <td className="px-3 py-3">
        {isFolder ? (
          <MdFolder className="text-primary-500 text-xl" />
        ) : hasThumbnail && !imageError ? (
          <div className="relative h-8 w-8 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-gray-600" />
            )}
            <img
              src={thumbnailSrc}
              alt={file.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.warn("[GalleryDetail] thumbnail load failed", {
                  fileId: file.id,
                  mimeType: file.mimeType,
                });
                setImageError(true);
              }}
              className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        ) : file.mimeType === "application/pdf" ? (
          <MdPictureAsPdf className="text-xl text-red-400" />
        ) : isImage ? (
          <MdImage className="text-xl text-blue-400" />
        ) : isVideo ? (
          <MdVideoLibrary className="text-xl text-purple-400" />
        ) : (
          <MdInsertDriveFile className="text-xl text-gray-400" />
        )}
      </td>
      <td className="max-w-[200px] min-w-[140px] px-3 py-3">
        <span className="block truncate font-medium text-gray-900 dark:text-white">
          {file.name}
        </span>
      </td>
      <td className="px-3 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
        {formatDate(file.createdTime)}
      </td>
      <td className="px-3 py-3 text-right whitespace-nowrap text-gray-500 dark:text-gray-400">
        {isFolder ? "—" : formatKB(file.size)}
      </td>
      <td className="px-1 py-3">
        {!selectionMode && (
          <button
            type="button"
            aria-label="更多選項"
            onClick={(e) => {
              e.stopPropagation();
              onMenuOpen?.(file);
            }}
            className="rounded-full p-1.5 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <MdMoreVert />
          </button>
        )}
      </td>
    </tr>
  );
}
