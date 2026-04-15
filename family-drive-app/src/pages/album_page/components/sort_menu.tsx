import { MdCheck } from "react-icons/md";

import { useDriveStore } from "../../../stores/drive_store";
import { BottomSheetMenu } from "../../../components/bottom_sheet_menu";

interface SortMenuProps {
  onClose: () => void;
}

type SortOption = {
  label: string;
  sortBy: "name" | "modifiedTime";
  sortOrder: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "名稱 (A–Z)", sortBy: "name", sortOrder: "asc" },
  { label: "名稱 (Z–A)", sortBy: "name", sortOrder: "desc" },
  { label: "修改時間 (新到舊)", sortBy: "modifiedTime", sortOrder: "desc" },
  { label: "修改時間 (舊到新)", sortBy: "modifiedTime", sortOrder: "asc" },
];

export function SortMenu({ onClose }: SortMenuProps) {
  const sortBy = useDriveStore((s) => s.sortBy);
  const sortOrder = useDriveStore((s) => s.sortOrder);
  const setSorting = useDriveStore((s) => s.setSorting);

  return (
    <BottomSheetMenu open={true} onClose={onClose} title="排序方式" align="left">
      {SORT_OPTIONS.map((opt) => {
        const isActive = sortBy === opt.sortBy && sortOrder === opt.sortOrder;
        return (
          <button
            key={`${opt.sortBy}-${opt.sortOrder}`}
            type="button"
            role="menuitem"
            onClick={() => {
              setSorting(opt.sortBy, opt.sortOrder);
              onClose();
            }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-base transition-colors active:bg-gray-100 sm:py-2.5 dark:active:bg-gray-700 ${
              isActive
                ? "text-primary-600 dark:text-primary-400 font-semibold"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
            }`}
          >
            <span className="flex-1 text-left">{opt.label}</span>
            {isActive && <MdCheck className="text-primary-600 dark:text-primary-400 text-base" />}
          </button>
        );
      })}
    </BottomSheetMenu>
  );
}
