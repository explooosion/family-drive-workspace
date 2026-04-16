import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../stores/auth_store";
import { useDriveStore } from "../../stores/drive_store";
import { useSettingsStore } from "../../stores/settings_store";
import { usePreferencesStore } from "../../stores/preferences_store";
import { CreateAlbumDialog } from "../../components/create_album_dialog";
import { CreateFolderDialog } from "../../components/create_folder_dialog";
import { UploadPanel } from "../../components/upload_panel";
import { MediaLightbox } from "../../components/media_lightbox";

import { useTokenMonitor } from "./hooks/use_token_monitor";
import { useDriveInitialization } from "./hooks/use_drive_initialization";
import { useDialogStates } from "./hooks/use_dialog_states";
import { useFileOperations } from "./hooks/use_file_operations";
import { useFolderUrl } from "./hooks/use_folder_url";
import { AlbumToolbar } from "./components/album_toolbar";
import { AlbumContent } from "./components/album_content";
import { FloatingActionButton } from "../../components/floating_action_button";
import { ToastMessage } from "../../components/toast_message";

export function AlbumPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userInfo = useAuthStore((s) => s.userInfo);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const folderStack = useDriveStore((s) => s.folderStack);
  const files = useDriveStore((s) => s.files);
  const loading = useDriveStore((s) => s.loading);
  const forceRefreshCurrentFolder = useDriveStore((s) => s.forceRefreshCurrentFolder);
  const selectedIds = useDriveStore((s) => s.selectedIds);
  const selectionMode = useDriveStore((s) => s.selectionMode);
  const enterSelectionMode = useDriveStore((s) => s.enterSelectionMode);
  const exitSelectionMode = useDriveStore((s) => s.exitSelectionMode);
  const settings = useSettingsStore((s) => s.settings);
  const autoEnterAlbumOnCreate = usePreferencesStore((s) => s.autoEnterAlbumOnCreate);
  const navigateToFolder = useDriveStore((s) => s.navigateToFolder);

  const selectedSizeMb = useMemo(() => {
    let total = 0;
    for (const id of selectedIds) {
      const f = files.find((fi) => fi.id === id);
      if (f?.size) {
        total += parseInt(f.size, 10);
      }
    }
    return (total / 1048576).toFixed(2);
  }, [selectedIds, files]);

  const { isTokenExpired, isRefreshing, handleRefreshToken } = useTokenMonitor();
  useDriveInitialization();
  useFolderUrl();

  // 追蹤等待 token 的時間，如果超過 10 秒仍未取得，提供重新登入選項
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [prevTokenState, setPrevTokenState] = useState({ accessToken, isTokenExpired });

  // 使用 derived state 模式：當 accessToken 或 isTokenExpired 改變時重置 timeout message
  if (
    prevTokenState.accessToken !== accessToken ||
    prevTokenState.isTokenExpired !== isTokenExpired
  ) {
    setPrevTokenState({ accessToken, isTokenExpired });
    setShowTimeoutMessage(false);
  }

  const {
    showCreateAlbum,
    setShowCreateAlbum,
    showCreateFolder,
    setShowCreateFolder,
    showUpload,
    setShowUpload,
    showSortMenu,
    setShowSortMenu,
  } = useDialogStates();

  const {
    lightboxOpen,
    setLightboxOpen,
    lightboxIndex,
    mediaFiles,
    handleFileClick,
    handleDeleteSelected,
    handleDownloadSelected,
    handleUploadDone,
    toast,
    clearToast,
  } = useFileOperations();

  const isRoot = folderStack.length <= 1;
  const isAdmin = userInfo?.role === "admin";
  const canUpload = !isRoot && settings.allowUpload;
  const canDelete = settings.allowDelete && (isAdmin || (!isRoot && folderStack.length > 2));
  const canEnterSelection = isAdmin || !isRoot;
  const shouldUseListMode = isRoot;

  // Handler functions
  async function handleRelogin() {
    await logout();
    navigate("/login");
  }

  function handleToggleSortMenu() {
    setShowSortMenu(!showSortMenu);
  }

  function handleCloseSortMenu() {
    setShowSortMenu(false);
  }

  function handleRefresh() {
    if (accessToken) {
      forceRefreshCurrentFolder(accessToken);
    }
  }

  function handleCreateAlbumOpen() {
    setShowCreateAlbum(true);
  }

  function handleCreateAlbumClose() {
    setShowCreateAlbum(false);
  }

  function handleAlbumCreated(folderId: string, folderName: string) {
    if (autoEnterAlbumOnCreate) {
      navigateToFolder(folderId, folderName);
    }
  }

  function handleCreateFolderOpen() {
    setShowCreateFolder(true);
  }

  function handleCreateFolderClose() {
    setShowCreateFolder(false);
  }

  function handleUploadOpen() {
    setShowUpload(true);
  }

  function handleUploadClose() {
    setShowUpload(false);
  }

  function handleLightboxClose() {
    setLightboxOpen(false);
  }

  // Effects
  useEffect(
    function setupTokenTimeoutWhenAccessMissing() {
      if (accessToken || isTokenExpired) {
        return;
      }

      const timer = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 10000);

      return () => clearTimeout(timer);
    },
    [accessToken, isTokenExpired],
  );

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-gray-500">
        {isTokenExpired ? (
          <div className="card max-w-md p-6 text-center">
            <p className="text-danger-500 mb-4 text-base">您的 Google Drive 存取權限已過期</p>
            <button
              type="button"
              onClick={handleRefreshToken}
              disabled={isRefreshing}
              className="btn-primary"
            >
              {isRefreshing ? "授權中..." : "重新授權"}
            </button>
          </div>
        ) : showTimeoutMessage ? (
          <div className="card max-w-md p-6 text-center">
            <p className="mb-4 text-base text-gray-700 dark:text-gray-300">
              取得存取權限時發生問題
            </p>
            <button type="button" onClick={handleRelogin} className="btn-primary">
              重新登入
            </button>
          </div>
        ) : (
          <p className="rounded-full bg-black/35 px-4 py-1.5 text-base text-white/90 backdrop-blur-sm">
            正在取得存取權限...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar 固定在 Header 下方，隨頁面捲動保持置頂 */}
      <div className="sticky top-14 z-30">
        <AlbumToolbar
          isRoot={isRoot}
          canEnterSelection={canEnterSelection}
          selectionMode={selectionMode}
          selectedCount={selectedIds.size}
          selectedSizeMb={selectedSizeMb}
          canDelete={canDelete}
          showSortMenu={showSortMenu}
          onToggleSortMenu={handleToggleSortMenu}
          onCloseSortMenu={handleCloseSortMenu}
          onRefresh={handleRefresh}
          isRefreshing={loading}
          onExitSelection={exitSelectionMode}
          onDelete={handleDeleteSelected}
          onDownload={handleDownloadSelected}
          onEnterSelection={() => enterSelectionMode()}
        />
      </div>

      <AlbumContent
        shouldUseListMode={shouldUseListMode}
        isRoot={isRoot}
        canDelete={canDelete}
        onFileClick={handleFileClick}
      />

      {!selectionMode && (
        <FloatingActionButton
          isRoot={isRoot}
          canUpload={canUpload}
          onCreateAlbum={handleCreateAlbumOpen}
          onCreateFolder={handleCreateFolderOpen}
          onUpload={handleUploadOpen}
        />
      )}

      {showCreateAlbum && (
        <CreateAlbumDialog
          onClose={handleCreateAlbumClose}
          onSuccess={handleUploadDone}
          onAlbumCreated={handleAlbumCreated}
        />
      )}
      {showCreateFolder && (
        <CreateFolderDialog onClose={handleCreateFolderClose} onSuccess={handleUploadDone} />
      )}
      {showUpload && <UploadPanel onClose={handleUploadClose} onSuccess={handleUploadDone} />}
      {lightboxOpen && (
        <MediaLightbox
          files={mediaFiles}
          initialIndex={lightboxIndex}
          onClose={handleLightboxClose}
        />
      )}
      {toast && <ToastMessage message={toast.message} type={toast.type} onDismiss={clearToast} />}
    </div>
  );
}
