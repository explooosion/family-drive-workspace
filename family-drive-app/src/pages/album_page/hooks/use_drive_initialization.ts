import { useEffect } from "react";

import { useAuthStore } from "../../../stores/auth_store";
import { useDriveStore } from "../../../stores/drive_store";

export function useDriveInitialization() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const rootFolderId = useDriveStore((s) => s.rootFolderId);
  const currentFolderId = useDriveStore((s) => s.currentFolderId);
  const initRootFolder = useDriveStore((s) => s.initRootFolder);
  const refreshFiles = useDriveStore((s) => s.refreshFiles);
  const syncChanges = useDriveStore((s) => s.syncChanges);

  useEffect(
    function initDriveWhenTokenReady() {
      if (!accessToken || rootFolderId) {
        return;
      }
      async function run() {
        if (!accessToken) {
          return;
        }
        // syncChanges 是背景緩存更新，不等待，避免阻斷初始化
        void syncChanges(accessToken);
        await initRootFolder(accessToken);
      }
      run();
    },
    [accessToken, rootFolderId, syncChanges, initRootFolder],
  );

  useEffect(
    function refreshFilesWhenFolderChanges() {
      if (accessToken && currentFolderId) {
        refreshFiles(accessToken);
      }
    },
    [accessToken, currentFolderId, refreshFiles],
  );
}
