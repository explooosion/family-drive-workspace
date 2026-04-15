import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import { useDriveStore } from "../../../stores/drive_store";

/**
 * 將 folderStack 同步至 URL 查詢參數 ?s=<base64>
 * 以及在頁面初始化後從 URL 還原目錄路徑
 *
 * 注意：mount 時立即捕獲初始 ?s= 參數至 ref，防止 syncStackToUrl
 * 在 restoreFromUrl 讀取前就清除該參數（HashRouter 競態條件）。
 */
export function useFolderUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderStack = useDriveStore((s) => s.folderStack);
  const rootFolderId = useDriveStore((s) => s.rootFolderId);
  const restoreFolderStack = useDriveStore((s) => s.restoreFolderStack);

  // 在任何 effect 執行前，先捕獲初始 ?s= 參數
  const initialSRef = useRef(searchParams.get("s"));
  const hasRestoredRef = useRef(false);

  // folderStack 變動時同步至 URL
  useEffect(
    function syncStackToUrl() {
      if (folderStack.length === 0) {
        return;
      }
      if (folderStack.length <= 1) {
        // 根層級：只有在已還原（或從未有初始參數）時才清除 ?s=
        if (searchParams.has("s") && (hasRestoredRef.current || !initialSRef.current)) {
          setSearchParams({}, { replace: true });
        }
        return;
      }
      try {
        const encoded = btoa(
          encodeURIComponent(JSON.stringify(folderStack.map((f) => ({ i: f.id, n: f.name })))),
        );
        if (searchParams.get("s") !== encoded) {
          setSearchParams({ s: encoded }, { replace: true });
        }
      } catch {
        // 忽略編碼錯誤
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folderStack],
  );

  // rootFolderId 初始化後，嘗試從 URL 還原目錄
  useEffect(
    function restoreFromUrl() {
      if (!rootFolderId) {
        return;
      }
      if (folderStack.length > 1) {
        return; // 已經導航，不再還原
      }
      // 使用 ref 中保存的初始參數，避免被 syncStackToUrl 清除後讀不到
      const encoded = initialSRef.current;
      if (!encoded) {
        return;
      }
      try {
        const raw = JSON.parse(decodeURIComponent(atob(encoded))) as {
          i: string;
          n: string;
        }[];
        if (!Array.isArray(raw) || raw.length === 0) {
          return;
        }
        // 第一個必須是 root
        if (raw[0].i !== rootFolderId) {
          return;
        }
        const stack = raw.map((r) => ({ id: r.i, name: r.n }));
        if (stack.length > 1) {
          hasRestoredRef.current = true;
          restoreFolderStack(stack);
        }
      } catch {
        // URL 格式損壞，忽略
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootFolderId],
  );
}
