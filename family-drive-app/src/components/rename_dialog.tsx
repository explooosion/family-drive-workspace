import { useState, useRef, useEffect } from "react";

import type { DriveFile } from "../types";
import { isFolderMime } from "../services/google_drive";
import { MobileSheet } from "./mobile_sheet";

interface RenameDialogProps {
  file: DriveFile;
  onConfirm: (newName: string) => Promise<void>;
  onClose: () => void;
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

function splitFilename(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) {
    return { base: name, ext: "" };
  }
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

export function RenameDialog({ file, onConfirm, onClose }: RenameDialogProps) {
  const isFolder = isFolderMime(file.mimeType);
  const { base: initialBase, ext } = isFolder
    ? { base: file.name, ext: "" }
    : splitFilename(file.name);

  const [base, setBase] = useState(initialBase);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 350);
    return () => clearTimeout(t);
  }, []);

  const newName = base.trim() + ext;
  const isInvalid = !base.trim();
  const isUnchanged = newName === file.name;

  async function handleConfirm() {
    if (isInvalid || isUnchanged) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onConfirm(newName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新命名失敗，請重試");
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !isInvalid && !isUnchanged && !loading) {
      handleConfirm();
    }
  }

  const borderClass = error
    ? "border-danger-500"
    : "border-gray-200 focus-within:border-primary-500 dark:border-gray-600";

  return (
    <MobileSheet title="重新命名" onClose={onClose}>
      <div className="px-4 pb-2">
        <div className={`flex items-center overflow-hidden rounded-xl border-2 ${borderClass}`}>
          <input
            type="text"
            ref={inputRef}
            value={base}
            onChange={(e) => setBase(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="請輸入名稱"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-gray-900 focus:outline-none dark:bg-transparent dark:text-white"
          />
          {ext && (
            <span className="shrink-0 px-3 text-base text-gray-400 select-none dark:text-gray-500">
              {ext}
            </span>
          )}
        </div>
        {error && <p className="text-danger-600 dark:text-danger-400 mt-2 text-base">{error}</p>}
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
          onClick={handleConfirm}
          disabled={isInvalid || isUnchanged || loading}
          className="bg-primary-600 hover:bg-primary-700 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner />
              更新中…
            </>
          ) : (
            "重新命名"
          )}
        </button>
      </div>
    </MobileSheet>
  );
}
