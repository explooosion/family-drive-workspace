import { useState } from "react";
import { MdFolder, MdVideoLibrary, MdInsertDriveFile, MdMoreVert } from "react-icons/md";

import type { DriveFile } from "../types";
import { useAuthStore } from "../stores/auth_store";
import { isFolderMime, isImageMime, getThumbnailUrl } from "../services/google_drive";
import { useHdImage } from "../hooks/use_hd_image";

type GridMode = "large" | "medium" | "small";

type Props = {
  files: DriveFile[];
  selected: Set<string>;
  selectionMode: boolean;
  mode: GridMode;
  onOpen: (file: DriveFile) => void;
  onSelect: (fileId: string) => void;
  onMenuOpen?: (file: DriveFile) => void;
};

const GRID_COLS: Record<GridMode, string> = {
  large: "grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3",
  medium: "grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  small: "grid-cols-3 gap-1 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9",
};

export function GalleryGrid({
  files,
  selected,
  selectionMode,
  mode,
  onOpen,
  onSelect,
  onMenuOpen,
}: Props) {
  return (
    <>
      <div className={`grid ${GRID_COLS[mode]} p-2`}>
        {files.map((file) => (
          <GridTile
            key={file.id}
            file={file}
            mode={mode}
            isSelected={selected.has(file.id)}
            selectionMode={selectionMode}
            onOpen={onOpen}
            onSelect={onSelect}
            onMenuOpen={onMenuOpen}
          />
        ))}
      </div>
      <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-600">
        已經滑到最底囉！
      </div>
    </>
  );
}

function GridTile({
  file,
  mode,
  isSelected,
  selectionMode,
  onOpen,
  onSelect,
  onMenuOpen,
}: {
  file: DriveFile;
  mode: GridMode;
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
  const hasThumbnail = !!accessToken && (isImage || (isVideo && !!file.thumbnailLink));

  const thumbnailSrc = accessToken ? getThumbnailUrl(file, accessToken) : "";
  const { displaySrc, containerRef: hdContainerRef } = useHdImage(thumbnailSrc, hasThumbnail);
  const showName = true; // 所有模式均顯示檔名

  return (
    <div
      ref={hdContainerRef}
      className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 bg-white transition-all hover:shadow-md dark:bg-gray-800 ${
        isSelected
          ? "border-primary-500 scale-95 shadow-lg"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
      }`}
      onClick={() => (selectionMode ? (isFolder ? undefined : onSelect(file.id)) : onOpen(file))}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isFolder ? (
        <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
          <MdFolder
            className={mode === "small" ? "text-primary-600 text-4xl" : "text-primary-600 text-6xl"}
          />
        </div>
      ) : hasThumbnail && !imageError ? (
        <div className="relative h-full w-full bg-gray-900">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
          )}
          <img
            src={displaySrc}
            alt={file.name}
            className={`h-full w-full object-cover transition-all duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <MdVideoLibrary
                className={
                  mode === "small" ? "text-3xl text-white" : "text-5xl text-white drop-shadow-lg"
                }
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
          <MdInsertDriveFile
            className={mode === "small" ? "text-4xl text-gray-400" : "text-6xl text-gray-400"}
          />
        </div>
      )}

      {showName && (
        <div
          className={`absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent ${
            mode === "small" ? "px-1 py-1" : "px-2 py-2"
          }`}
        >
          <p
            className={`truncate font-medium text-white drop-shadow-lg ${
              mode === "small" ? "text-base leading-tight" : "text-base"
            }`}
          >
            {file.name}
          </p>
        </div>
      )}

      {selectionMode && !isFolder && (
        <div className="absolute top-1 right-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(file.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 rounded border-2 border-white shadow-lg"
          />
        </div>
      )}
      {!selectionMode && (
        <button
          type="button"
          aria-label="更多選項"
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen?.(file);
          }}
          className="absolute top-1 right-1 rounded-full bg-black/40 p-1 text-lg text-white backdrop-blur-sm hover:bg-black/60"
        >
          <MdMoreVert />
        </button>
      )}
    </div>
  );
}
