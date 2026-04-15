import { useState, useRef, useEffect } from "react";

import { createFolder } from "../services/google_drive";
import { useAuthStore } from "../stores/auth_store";
import { useDriveStore } from "../stores/drive_store";
import { MobileSheet } from "./mobile_sheet";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

export function CreateFolderDialog({ onClose, onSuccess }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentFolderId = useDriveStore((s) => s.currentFolderId);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 延遲聚焦以避免 iOS 在底部 sheet 動畫進行中時捲動畫面
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  async function handleCreate() {
    if (!accessToken || !name.trim()) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createFolder(accessToken, name.trim(), currentFolderId ?? undefined);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗，請重試");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && name.trim() && !loading) {
      handleCreate();
    }
  }

  return (
    <MobileSheet title="建立資料夾" onClose={onClose}>
      <div className="px-4 pb-2">
        <input
          type="text"
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="請輸入資料夾名稱"
          className="focus:border-primary-500 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        {error && <p className="mt-2 text-base text-red-500 dark:text-red-400">{error}</p>}
      </div>
      <div className="flex gap-2 px-4 pt-2 pb-6 sm:pb-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl bg-gray-100 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="bg-primary-600 hover:bg-primary-700 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner />
              建立中…
            </>
          ) : (
            "建立"
          )}
        </button>
      </div>
    </MobileSheet>
  );
}
