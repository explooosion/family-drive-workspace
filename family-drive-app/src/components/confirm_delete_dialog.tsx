import { useState } from "react";
import { MdDelete } from "react-icons/md";

import { MobileSheet } from "./mobile_sheet";

interface ConfirmDeleteDialogProps {
  filename: string;
  onConfirm: () => Promise<void>;
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

export function ConfirmDeleteDialog({ filename, onConfirm, onClose }: ConfirmDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗，請重試");
      setLoading(false);
    }
  }

  return (
    <MobileSheet title="刪除檔案" onClose={onClose}>
      <div className="px-4 pb-2">
        <div className="bg-danger-50 dark:bg-danger-950/30 flex items-start gap-3 rounded-xl p-4">
          <MdDelete className="text-danger-600 dark:text-danger-400 mt-0.5 shrink-0 text-xl" />
          <p className="text-base text-gray-700 dark:text-gray-300">
            確定要刪除{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{filename}</span> 嗎？
          </p>
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
          disabled={loading}
          className="bg-danger-600 hover:bg-danger-700 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner />
              刪除中…
            </>
          ) : (
            "刪除"
          )}
        </button>
      </div>
    </MobileSheet>
  );
}
