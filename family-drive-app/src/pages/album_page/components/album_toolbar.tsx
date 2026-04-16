import { useState } from "react";
import {
  MdClose,
  MdDelete,
  MdSort,
  MdFileDownload,
  MdRefresh,
  MdMoreVert,
  MdChecklist,
} from "react-icons/md";

import { SortMenu } from "./sort_menu";
import { ViewModeCycleButton } from "./view_mode_cycle_button";
import { BottomSheetMenu } from "../../../components/bottom_sheet_menu";

interface AlbumToolbarProps {
  isRoot: boolean;
  canEnterSelection: boolean;
  selectionMode: boolean;
  selectedCount: number;
  selectedSizeMb: string;
  canDelete: boolean;
  showSortMenu: boolean;
  onToggleSortMenu: () => void;
  onCloseSortMenu: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExitSelection: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onEnterSelection: () => void;
}

export function AlbumToolbar({
  isRoot,
  canEnterSelection,
  selectionMode,
  selectedCount,
  selectedSizeMb,
  canDelete,
  showSortMenu,
  onToggleSortMenu,
  onCloseSortMenu,
  onRefresh,
  isRefreshing,
  onExitSelection,
  onDelete,
  onDownload,
  onEnterSelection,
}: AlbumToolbarProps) {
  const [actionsOpen, setActionsOpen] = useState(false);

  if (selectionMode) {
    return (
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={onExitSelection}
          className="btn-icon text-2xl"
          aria-label="取消選擇"
        >
          <MdClose />
        </button>
        <span className="flex-1 text-base font-medium text-gray-700 dark:text-gray-300">
          已選擇 {selectedCount} 項，共計 {selectedSizeMb} MB
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="btn-icon text-2xl"
            aria-label="更多動作"
          >
            <MdMoreVert />
          </button>
          <BottomSheetMenu
            open={actionsOpen}
            onClose={() => setActionsOpen(false)}
            title="選取項目操作"
            align="right"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onDownload();
                setActionsOpen(false);
              }}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-base text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:py-2.5 dark:text-gray-200 dark:hover:bg-gray-700/50"
            >
              <MdFileDownload className="text-xl text-gray-500 dark:text-gray-400" />
              儲存
            </button>
            {canDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDelete();
                  setActionsOpen(false);
                }}
                className="text-danger-600 hover:bg-danger-50 active:bg-danger-100 dark:text-danger-400 dark:hover:bg-danger-900/20 flex w-full items-center gap-4 px-4 py-3.5 text-base transition-colors sm:py-2.5"
              >
                <MdDelete className="text-xl" />
                刪除
              </button>
            )}
          </BottomSheetMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-1 gap-1">
        {!isRoot && <ViewModeCycleButton />}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleSortMenu}
            className="btn-icon text-xl"
            aria-label="排序"
          >
            <MdSort />
          </button>
          {showSortMenu && <SortMenu onClose={onCloseSortMenu} />}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-icon text-xl"
          aria-label="重新讀取"
        >
          <MdRefresh />
        </button>
      </div>
      {canEnterSelection && (
        <button
          type="button"
          onClick={onEnterSelection}
          className="btn-icon text-xl"
          aria-label="多選模式"
        >
          <MdChecklist />
        </button>
      )}
    </div>
  );
}
