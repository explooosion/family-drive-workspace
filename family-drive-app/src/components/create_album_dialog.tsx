import { useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

import { createFolder } from "../services/google_drive";
import { useAuthStore } from "../stores/auth_store";
import { useDriveStore } from "../stores/drive_store";
import { MobileSheet } from "./mobile_sheet";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  onAlbumCreated?: (folderId: string, folderName: string) => void;
};

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

const DAY_PICKER_CLASS_NAMES = {
  root: "w-full",
  months: "w-full",
  month: "w-full",
  month_caption: "relative flex h-10 items-center justify-center mb-2",
  dropdowns: "flex items-center gap-1.5",
  dropdown_root: "relative",
  dropdown:
    "cursor-pointer rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-2.5 pr-1 text-sm font-semibold text-gray-800 focus:border-primary-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white",
  caption_label: "sr-only",
  nav: "absolute w-full flex items-center justify-between pointer-events-none",
  button_previous:
    "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 transition-colors dark:text-gray-400 dark:hover:bg-gray-600",
  button_next:
    "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 transition-colors dark:text-gray-400 dark:hover:bg-gray-600",
  month_grid: "w-full",
  weekdays: "flex",
  weekday: "flex-1 text-center py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500",
  week: "flex",
  day: "flex-1 flex justify-center py-0.5",
  day_button: [
    "h-10 w-10 flex items-center justify-center rounded-full text-sm",
    "text-gray-800 dark:text-gray-200",
    "transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
    "aria-selected:bg-primary-600 aria-selected:text-white aria-selected:hover:bg-primary-700",
    "disabled:cursor-not-allowed disabled:opacity-30 disabled:pointer-events-none",
  ].join(" "),
  today: "font-bold",
  outside: "opacity-30",
  hidden: "invisible",
};

export function CreateAlbumDialog({ onClose, onSuccess, onAlbumCreated }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentFolderId = useDriveStore((s) => s.currentFolderId);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }

  const dateString = formatDateStr(selectedDate);
  const canCreate = title.trim().length > 0;

  function handleDaySelect(date: Date | undefined) {
    if (!date) {
      return;
    }
    setSelectedDate(date);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  }

  async function handleCreate() {
    if (!accessToken || !canCreate) {
      return;
    }
    const folderName = `${dateString}-${title.trim()}`;
    setLoading(true);
    setError("");
    try {
      const created = await createFolder(accessToken, folderName, currentFolderId ?? undefined);
      onSuccess();
      onClose();
      if (onAlbumCreated) {
        onAlbumCreated(created.id, created.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗，請重試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileSheet title="建立相簿" onClose={onClose}>
      <div className="max-h-[80vh] overflow-y-auto px-4 pb-2 sm:max-h-none">
        {/* 日期選擇 */}
        <div className="mb-4">
          <label className="mb-2 block text-base font-medium text-gray-700 dark:text-gray-300">
            選擇日期
          </label>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              captionLayout="dropdown"
              formatters={{
                formatWeekdayName: (date) => WEEKDAY_NAMES[date.getDay()],
                formatMonthDropdown: (date) => `${date.getMonth() + 1}月`,
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <MdChevronLeft className="h-4 w-4" />
                  ) : (
                    <MdChevronRight className="h-4 w-4" />
                  ),
              }}
              classNames={DAY_PICKER_CLASS_NAMES}
            />
          </div>
          <p className="mt-2 text-base text-gray-400 dark:text-gray-500">
            已選：
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
              {dateString}
            </span>
          </p>
        </div>

        {/* 標題 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-base font-medium text-gray-700 dark:text-gray-300">
            相簿標題
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) {
                handleCreate();
              }
            }}
            placeholder="例如：春遊、生日"
            className="focus:border-primary-500 w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-base text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 預覽 */}
        {canCreate && (
          <div className="bg-primary-50 dark:bg-primary-900/20 mb-2 rounded-xl px-4 py-3">
            <p className="text-base text-gray-500 dark:text-gray-400">資料夾名稱</p>
            <p className="text-primary-700 dark:text-primary-400 mt-0.5 font-mono text-base font-semibold">
              {dateString}-{title.trim()}
            </p>
          </div>
        )}

        {error && <p className="mb-2 text-base text-red-500 dark:text-red-400">{error}</p>}
      </div>

      {/* 按鈕 */}
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
          disabled={!canCreate || loading}
          className="bg-primary-600 hover:bg-primary-700 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-medium text-white transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner />
              建立中…
            </>
          ) : (
            "建立相簿"
          )}
        </button>
      </div>
    </MobileSheet>
  );
}
