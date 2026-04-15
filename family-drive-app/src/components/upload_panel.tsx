import { useState, useRef, useEffect, useCallback } from "react";
import { MdClose, MdCheckCircle, MdError, MdInsertDriveFile, MdCloudUpload } from "react-icons/md";

import { uploadFile } from "../services/google_drive";
import { useAuthStore } from "../stores/auth_store";
import { useDriveStore } from "../stores/drive_store";
import { usePreferencesStore } from "../stores/preferences_store";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

type UploadTask = {
  id: number;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  uploadedBytes?: number;
  error?: string;
  previewUrl?: string;
};

let taskIdSeq = 0;

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? "h-4 w-4"}`}
      aria-hidden="true"
    />
  );
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadPanel({ onClose, onSuccess }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentFolderId = useDriveStore((s) => s.currentFolderId);
  const autoScrollUploadItem = usePreferencesStore((s) => s.autoScrollUploadItem);

  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const uploadingItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function addFiles(newFiles: File[]) {
    const newTasks: UploadTask[] = newFiles.map((file) => {
      let previewUrl: string | undefined;
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.push(previewUrl);
      }
      return {
        id: ++taskIdSeq,
        file,
        status: "pending",
        previewUrl,
      };
    });
    setTasks((prev) => [...prev, ...newTasks]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (uploading) {
        return;
      }
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [uploading],
  );

  function removeTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleUpload() {
    if (!accessToken || !currentFolderId) {
      return;
    }
    const pending = tasks.filter((t) => t.status === "pending");
    if (pending.length === 0) {
      return;
    }

    setUploading(true);
    setToast(null);
    setUploadProgress({ current: 0, total: pending.length });

    let successCount = 0;
    let errorCount = 0;
    let doneCount = 0;

    for (const task of tasks) {
      if (task.status !== "pending") {
        continue;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "uploading", uploadedBytes: 0 } : t,
        ),
      );

      if (autoScrollUploadItem) {
        requestAnimationFrame(() => {
          const el = uploadingItemRefs.current.get(task.id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      }

      try {
        await uploadFile(accessToken, task.file, currentFolderId, (uploadedBytes, totalBytes) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, status: "uploading", uploadedBytes: Math.min(uploadedBytes, totalBytes) }
                : t,
            ),
          );
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: "success", uploadedBytes: task.file.size } : t,
          ),
        );
        successCount++;
      } catch (err) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "error",
                  error: err instanceof Error ? err.message : "未知錯誤",
                }
              : t,
          ),
        );
        errorCount++;
      }

      doneCount++;
      setUploadProgress({ current: doneCount, total: pending.length });
    }

    setUploading(false);
    setUploadProgress(null);

    if (errorCount === 0) {
      setToast({ type: "success", message: `已成功上傳 ${successCount} 個檔案` });
      onSuccess();
      setTimeout(onClose, 1500);
    } else {
      setToast({
        type: "error",
        message: `${successCount} 個成功，${errorCount} 個失敗，請檢查後重試`,
      });
    }
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-lg rounded-t-2xl bg-white transition-colors sm:rounded-xl dark:bg-gray-800 ${
          isDragOver ? "ring-primary-500 ring-2 ring-offset-2" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 手機把手 */}
        <div className="mx-auto my-3 h-1 w-10 rounded-full bg-gray-300 sm:hidden dark:bg-gray-600" />

        {/* Toast 通知列 */}
        {toast && (
          <div
            className={`mx-4 mt-2 flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium ${
              toast.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <MdCheckCircle className="shrink-0 text-lg" />
            ) : (
              <MdError className="shrink-0 text-lg" />
            )}
            {toast.message}
          </div>
        )}

        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">上傳檔案</h2>
            {uploadProgress && (
              <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 rounded-full px-2 py-0.5 text-base font-medium">
                {uploadProgress.current} / {uploadProgress.total}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="btn-icon"
            aria-label="關閉"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="px-4 pb-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed py-6 text-base transition-colors disabled:opacity-50 ${
              isDragOver
                ? "border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-900/20"
                : "hover:border-primary-500 hover:text-primary-600 border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"
            }`}
          >
            <MdCloudUpload className="text-3xl" />
            <span>點擊選擇或拖曳檔案至此</span>
          </button>
        </div>

        {tasks.length > 0 && (
          <div ref={listRef} className="mx-4 mb-3 max-h-80 space-y-1.5 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => {
                  if (el) {
                    uploadingItemRefs.current.set(task.id, el);
                  } else {
                    uploadingItemRefs.current.delete(task.id);
                  }
                }}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-700/40"
              >
                {/* 縮圖或圖示 */}
                <div className="relative h-11 w-11 shrink-0">
                  {task.previewUrl ? (
                    <img
                      src={task.previewUrl}
                      alt={task.file.name}
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 dark:bg-gray-600">
                      <MdInsertDriveFile className="text-2xl text-gray-400" />
                    </div>
                  )}
                  {task.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
                      <Spinner className="h-5 w-5 border-white border-t-transparent" />
                    </div>
                  )}
                  {task.status === "success" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
                      <MdCheckCircle className="text-xl text-green-400" />
                    </div>
                  )}
                  {task.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
                      <MdError className="text-xl text-red-400" />
                    </div>
                  )}
                </div>

                {/* 檔案資訊 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-gray-900 dark:text-white">
                    {task.file.name}
                  </p>
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    {task.status === "uploading"
                      ? `${formatMb(task.uploadedBytes ?? 0)} / ${formatMb(task.file.size)}`
                      : formatMb(task.file.size)}
                    {task.status === "pending" && (
                      <span className="ml-2 text-gray-400">等待中</span>
                    )}
                    {task.status === "uploading" && (
                      <span className="text-primary-500 ml-2">上傳中…</span>
                    )}
                    {task.status === "success" && (
                      <span className="ml-2 text-green-600 dark:text-green-400">已完成</span>
                    )}
                  </p>
                  {task.error && <p className="truncate text-base text-red-500">{task.error}</p>}
                </div>

                {/* 移除按鈕（pending 且未上傳中才顯示） */}
                {task.status === "pending" && !uploading && (
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-600 dark:hover:text-red-400"
                    aria-label={`移除 ${task.file.name}`}
                  >
                    <MdClose className="text-base" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 底部按鈕 */}
        <div className="flex gap-2 px-4 pt-2 pb-6 sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 rounded-xl bg-gray-100 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || pendingCount === 0}
            className="bg-primary-600 hover:bg-primary-700 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-medium text-white transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Spinner />
                上傳中…
              </>
            ) : (
              `開始上傳${pendingCount > 0 ? ` (${pendingCount})` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
