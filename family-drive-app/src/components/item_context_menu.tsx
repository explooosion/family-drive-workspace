import { MdFileDownload, MdDriveFileRenameOutline, MdDelete } from "react-icons/md";

import type { DriveFile } from "../types";
import { isFolderMime } from "../services/google_drive";
import { BottomSheetMenu } from "./bottom_sheet_menu";

interface ItemContextMenuProps {
  open: boolean;
  onClose: () => void;
  file: DriveFile;
  canDelete: boolean;
  onDownload: (file: DriveFile) => void;
  onRename: (file: DriveFile) => void;
  onDelete: (file: DriveFile) => void;
}

export function ItemContextMenu({
  open,
  onClose,
  file,
  canDelete,
  onDownload,
  onRename,
  onDelete,
}: ItemContextMenuProps) {
  const isFolder = isFolderMime(file.mimeType);

  return (
    <BottomSheetMenu open={open} onClose={onClose} title={file.name}>
      {!isFolder && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onDownload(file);
            onClose();
          }}
          className="flex w-full items-center gap-4 px-4 py-3.5 text-base text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:py-2.5 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:active:bg-gray-700"
        >
          <MdFileDownload className="text-xl text-gray-500 dark:text-gray-400" />
          儲存
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onRename(file);
          onClose();
        }}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-base text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:py-2.5 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:active:bg-gray-700"
      >
        <MdDriveFileRenameOutline className="text-xl text-gray-500 dark:text-gray-400" />
        重新命名
      </button>
      {canDelete && (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onDelete(file);
            onClose();
          }}
          className="text-danger-600 hover:bg-danger-50 active:bg-danger-100 dark:text-danger-400 dark:hover:bg-danger-900/20 dark:active:bg-danger-900/30 flex w-full items-center gap-4 px-4 py-3.5 text-base transition-colors sm:py-2.5"
        >
          <MdDelete className="text-xl" />
          刪除
        </button>
      )}
    </BottomSheetMenu>
  );
}
