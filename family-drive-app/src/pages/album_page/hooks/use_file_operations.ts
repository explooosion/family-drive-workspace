import { useState } from "react";

import { useAuthStore } from "../../../stores/auth_store";
import { useDriveStore } from "../../../stores/drive_store";
import { useSettingsStore } from "../../../stores/settings_store";
import { isFolderMime, isImageMime, isVideoMime } from "../../../services/google_drive";
import { useSaveImage } from "../../../hooks/use_save_image";
import type { DriveFile } from "../../../types";

interface Toast {
  message: string;
  type: "warning" | "error";
}

export function useFileOperations() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userInfo = useAuthStore((s) => s.userInfo);
  const files = useDriveStore((s) => s.files);
  const selectionMode = useDriveStore((s) => s.selectionMode);
  const selectedIds = useDriveStore((s) => s.selectedIds);
  const folderStack = useDriveStore((s) => s.folderStack);
  const toggleSelection = useDriveStore((s) => s.toggleSelection);
  const exitSelectionMode = useDriveStore((s) => s.exitSelectionMode);
  const navigateToFolder = useDriveStore((s) => s.navigateToFolder);
  const forceRefreshCurrentFolder = useDriveStore((s) => s.forceRefreshCurrentFolder);
  const softDelete = useDriveStore((s) => s.softDelete);
  const settings = useSettingsStore((s) => s.settings);
  const { saveImage } = useSaveImage();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  const isRoot = folderStack.length <= 1;
  const isAdmin = userInfo?.role === "admin";
  const mediaFiles = files.filter((f) => isImageMime(f.mimeType) || isVideoMime(f.mimeType));

  function handleFileClick(file: DriveFile) {
    if (isFolderMime(file.mimeType)) {
      // 資料夾在 selection mode 下也執行導航，不進入選取
      navigateToFolder(file.id, file.name);
      return;
    }
    if (selectionMode) {
      // 影片不支援選取
      if (!isVideoMime(file.mimeType)) {
        toggleSelection(file.id);
      }
      return;
    }
    if (isImageMime(file.mimeType) || isVideoMime(file.mimeType)) {
      const mediaIndex = mediaFiles.findIndex((f) => f.id === file.id);
      if (mediaIndex >= 0) {
        setLightboxIndex(mediaIndex);
        setLightboxOpen(true);
      }
    }
  }

  async function handleDeleteSelected() {
    if (!accessToken || !settings.allowDelete) {
      return;
    }

    if (isRoot && !isAdmin) {
      setToast({ message: "活動相簿不能刪除", type: "warning" });
      return;
    }

    const isInsideAlbumFolder = folderStack.length === 2;
    if (isInsideAlbumFolder) {
      setToast({ message: "活動相簿內的內容不能刪除", type: "warning" });
      return;
    }

    const errors: string[] = [];
    for (const id of selectedIds) {
      try {
        await softDelete(accessToken, id);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
    exitSelectionMode();
    if (errors.length > 0) {
      setToast({ message: `部分檔案刪除失敗：${errors.join("、")}`, type: "error" });
    }
  }

  function handleUploadDone() {
    if (accessToken) {
      forceRefreshCurrentFolder(accessToken);
    }
  }

  // 批量下載選取的檔案（逐一下載，不打包壓縮）
  async function handleDownloadSelected() {
    if (!accessToken) {
      return;
    }
    for (const id of selectedIds) {
      const file = files.find((f) => f.id === id);
      if (!file) {
        continue;
      }
      // 影片檔案不支援批量下載
      if (isVideoMime(file.mimeType)) {
        continue;
      }
      try {
        await saveImage(file);
        // 瀏覽器需要短暫間隔才能處理多個下載
        await new Promise<void>((resolve) => setTimeout(resolve, 400));
      } catch {
        // 單一檔案失敗不中斷其餘下載
      }
    }
    exitSelectionMode();
  }

  return {
    lightboxOpen,
    setLightboxOpen,
    lightboxIndex,
    mediaFiles,
    handleFileClick,
    handleDeleteSelected,
    handleDownloadSelected,
    handleUploadDone,
    toast,
    clearToast: () => setToast(null),
  };
}
