import { useState } from "react";
import {
  MdGridView,
  MdViewList,
  MdViewModule,
  MdViewComfy,
  MdTableRows,
  MdExpandMore,
  MdCheck,
} from "react-icons/md";

import { useDriveStore } from "../../../stores/drive_store";
import { BottomSheetMenu } from "../../../components/bottom_sheet_menu";

type ViewMode = "large" | "medium" | "small" | "list" | "detail";

const VIEW_OPTIONS: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: "large", icon: <MdViewComfy />, label: "大縮圖" },
  { mode: "medium", icon: <MdGridView />, label: "中縮圖" },
  { mode: "small", icon: <MdViewModule />, label: "小縮圖" },
  { mode: "list", icon: <MdViewList />, label: "列表" },
  { mode: "detail", icon: <MdTableRows />, label: "詳細清單" },
];

export function ViewModeDropdown() {
  const viewMode = useDriveStore((s) => s.viewMode);
  const setViewMode = useDriveStore((s) => s.setViewMode);
  const [open, setOpen] = useState(false);

  const current = VIEW_OPTIONS.find((o) => o.mode === viewMode) ?? VIEW_OPTIONS[2];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="btn-icon flex items-center gap-0.5 px-2"
        aria-label="切換顯示模式"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-xl">{current.icon}</span>
        <MdExpandMore
          className={`text-base text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <BottomSheetMenu open={open} onClose={() => setOpen(false)} title="顯示模式" minWidth="9rem">
        {VIEW_OPTIONS.map((opt) => {
          const isActive = viewMode === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              role="menuitem"
              aria-checked={isActive}
              onClick={() => {
                setViewMode(opt.mode);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-base transition-colors active:bg-gray-100 sm:py-2.5 dark:active:bg-gray-700 ${
                isActive
                  ? "text-primary-600 dark:text-primary-400 font-semibold"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <span className="flex-1 text-left">{opt.label}</span>
              {isActive && <MdCheck className="text-primary-600 dark:text-primary-400 text-base" />}
            </button>
          );
        })}
      </BottomSheetMenu>
    </div>
  );
}
