import { useState } from "react";
import { MdFolder } from "react-icons/md";

import { useDriveStore } from "../../../stores/drive_store";
import { useAuthStore } from "../../../stores/auth_store";
import { isFolderMime, isVideoMime } from "../../../services/google_drive";
import { GalleryList } from "../../../components/gallery_view";
import { GalleryGrid } from "../../../components/gallery_grid";
import { GalleryDetail } from "../../../components/gallery_detail";
import { ItemContextMenu } from "../../../components/item_context_menu";
import { ConfirmDeleteDialog } from "../../../components/confirm_delete_dialog";
import { RenameDialog } from "../../../components/rename_dialog";
import { useSaveImage } from "../../../hooks/use_save_image";
import type { DriveFile } from "../../../types";

interface AlbumContentProps {
  shouldUseListMode: boolean;
  isRoot: boolean;
  canDelete: boolean;
  onFileClick: (file: DriveFile) => void;
}

export function AlbumContent({
  shouldUseListMode,
  isRoot,
  canDelete,
  onFileClick,
}: AlbumContentProps) {
  const files = useDriveStore((s) => s.files);
  const loading = useDriveStore((s) => s.loading);
  const error = useDriveStore((s) => s.error);
  const selectedIds = useDriveStore((s) => s.selectedIds);
  const selectionMode = useDriveStore((s) => s.selectionMode);
  const toggleSelection = useDriveStore((s) => s.toggleSelection);
  const viewMode = useDriveStore((s) => s.viewMode);
  const softDelete = useDriveStore((s) => s.softDelete);
  const renameItem = useDriveStore((s) => s.renameItem);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { saveImage } = useSaveImage();

  const [menuFile, setMenuFile] = useState<DriveFile | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<DriveFile | null>(null);
  const [pendingRenameFile, setPendingRenameFile] = useState<DriveFile | null>(null);

  function handleMenuOpen(file: DriveFile) {
    setMenuFile(file);
  }

  function handleMenuClose() {
    setMenuFile(null);
  }

  async function handleMenuDownload(file: DriveFile) {
    await saveImage(file);
  }

  function handleMenuRename(file: DriveFile) {
    setPendingRenameFile(file);
  }

  function handleMenuDelete(file: DriveFile) {
    setPendingDeleteFile(file);
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDeleteFile) {
      return;
    }
    await softDelete(accessToken, pendingDeleteFile.id);
  }

  async function handleConfirmRename(newName: string) {
    if (!accessToken || !pendingRenameFile) {
      return;
    }
    await renameItem(accessToken, pendingRenameFile.id, newName);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-primary-200 border-t-primary-600 h-10 w-10 animate-spin rounded-full border-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-950 rounded-xl border-2 p-6">
          <h3 className="text-danger-700 dark:text-danger-400 mb-2 text-lg font-bold">發生錯誤</h3>
          <pre className="text-danger-600 dark:text-danger-500 text-base whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <MdFolder className="mb-4 text-6xl" />
        <p className="text-base">此資料夾是空的</p>
      </div>
    );
  }

  const sharedProps = {
    files,
    selected: selectedIds,
    selectionMode,
    onOpen: onFileClick,
    onSelect: (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (file && isVideoMime(file.mimeType)) {
        return;
      }
      toggleSelection(fileId);
    },
    onMenuOpen: handleMenuOpen,
  };

  return (
    <>
      {/* 根層級固定使用 list 模式，隱藏 subtitle */}
      {shouldUseListMode && <GalleryList {...sharedProps} hideSubtitle={isRoot} />}
      {!shouldUseListMode &&
        (viewMode === "large" || viewMode === "medium" || viewMode === "small") && (
          <GalleryGrid {...sharedProps} mode={viewMode} />
        )}
      {!shouldUseListMode && viewMode === "list" && <GalleryList {...sharedProps} />}
      {!shouldUseListMode && viewMode === "detail" && <GalleryDetail {...sharedProps} />}

      {menuFile && (
        <ItemContextMenu
          open={!!menuFile}
          onClose={handleMenuClose}
          file={menuFile}
          canDelete={canDelete}
          onDownload={handleMenuDownload}
          onRename={handleMenuRename}
          onDelete={handleMenuDelete}
        />
      )}
      {pendingDeleteFile && (
        <ConfirmDeleteDialog
          filename={pendingDeleteFile.name}
          itemLabel={isFolderMime(pendingDeleteFile.mimeType) ? "相簿" : "檔案"}
          onConfirm={handleConfirmDelete}
          onClose={() => setPendingDeleteFile(null)}
        />
      )}
      {pendingRenameFile && (
        <RenameDialog
          file={pendingRenameFile}
          onConfirm={handleConfirmRename}
          onClose={() => setPendingRenameFile(null)}
        />
      )}
    </>
  );
}
