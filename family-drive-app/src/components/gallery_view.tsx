import { useState } from "react";
import { MdFolder, MdImage, MdVideoLibrary, MdInsertDriveFile, MdMoreVert } from "react-icons/md";

import type { DriveFile } from "../types";
import { isFolderMime, isImageMime, getThumbnailUrl } from "../services/google_drive";
import { useAuthStore } from "../stores/auth_store";

type GalleryProps = {
  files: DriveFile[];
  selected: Set<string>;
  selectionMode: boolean;
  onOpen: (file: DriveFile) => void;
  onSelect: (fileId: string) => void;
  onMenuOpen?: (file: DriveFile) => void;
  hideSubtitle?: boolean;
};

function formatDate(iso?: string): string {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 列表模式（相本根層與一般列表共用）
export function GalleryList({
  files,
  selected,
  selectionMode,
  onOpen,
  onSelect,
  onMenuOpen,
  hideSubtitle,
}: GalleryProps) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {files.map((file) => (
          <ListRow
            key={file.id}
            file={file}
            isSelected={selected.has(file.id)}
            selectionMode={selectionMode}
            onOpen={onOpen}
            onSelect={onSelect}
            onMenuOpen={onMenuOpen}
            hideSubtitle={hideSubtitle}
          />
        ))}
      </div>
      <div className="py-12 text-center text-base text-gray-400 dark:text-gray-600">
        已經滑到最底囉！
      </div>
    </>
  );
}

function ListRow({
  file,
  isSelected,
  selectionMode,
  onOpen,
  onSelect,
  onMenuOpen,
  hideSubtitle,
}: {
  file: DriveFile;
  isSelected: boolean;
  selectionMode: boolean;
  onOpen: (file: DriveFile) => void;
  onSelect: (fileId: string) => void;
  onMenuOpen?: (file: DriveFile) => void;
  hideSubtitle?: boolean;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isFolder = isFolderMime(file.mimeType);
  const isImage = isImageMime(file.mimeType);
  const isVideo = file.mimeType.startsWith("video/");
  const hasThumbnail = !!accessToken && (isImage || (isVideo && !!file.thumbnailLink));
  const thumbnailSrc = hasThumbnail ? getThumbnailUrl(file, accessToken!) : "";

  return (
    <div
      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
        isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
      }`}
      onClick={() => (selectionMode ? (isFolder ? undefined : onSelect(file.id)) : onOpen(file))}
      onContextMenu={(e) => e.preventDefault()}
    >
      {selectionMode && !isFolder && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(file.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5"
        />
      )}
      {isFolder ? (
        <MdFolder className="text-primary-600 h-12 w-12 flex-shrink-0" />
      ) : hasThumbnail && !imageError ? (
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-gray-600" />
          )}
          <img
            src={thumbnailSrc}
            alt={file.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
          {isImage ? (
            <MdImage className="text-2xl text-blue-400" />
          ) : isVideo ? (
            <MdVideoLibrary className="text-2xl text-purple-400" />
          ) : (
            <MdInsertDriveFile className="text-2xl text-gray-400" />
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-base font-medium text-gray-900 dark:text-white">{file.name}</p>
        {!hideSubtitle && file.createdTime && (
          <p className="text-base text-gray-500 dark:text-gray-400">
            {formatDate(file.createdTime)}
          </p>
        )}
      </div>
      {!selectionMode && (
        <button
          type="button"
          aria-label="更多選項"
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen?.(file);
          }}
          className="shrink-0 rounded-full p-1.5 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <MdMoreVert />
        </button>
      )}
    </div>
  );
}
