import React from "react";

interface BottomSheetMenuProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  align?: "left" | "right";
  minWidth?: string;
  children: React.ReactNode;
}

/**
 * 通用下拉/底部選單：
 * - Mobile (< sm)：固定底部 bottom sheet，含遮罩
 * - Desktop (≥ sm)：絕對定位 dropdown（parent 須為 relative）
 */
export function BottomSheetMenu({
  open,
  onClose,
  title,
  align = "left",
  minWidth = "10rem",
  children,
}: BottomSheetMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      {/* Mobile 深色遮罩 */}
      <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={onClose} />
      {/* Desktop 透明遮罩（點擊外部關閉） */}
      <div className="fixed inset-0 z-[39] hidden sm:block" onClick={onClose} />
      {/* Panel 本體 */}
      <div
        role="menu"
        style={{ minWidth }}
        className={`fixed right-0 bottom-0 left-0 z-50 rounded-t-2xl border-t border-gray-200 bg-white shadow-xl sm:absolute sm:top-full sm:bottom-auto sm:z-50 sm:mt-1 sm:rounded-xl sm:border sm:border-gray-200 sm:py-1 sm:shadow-md dark:border-gray-700 dark:bg-[#242526] dark:sm:border-gray-700 ${align === "right" ? "sm:right-0 sm:left-auto" : "sm:left-0"} `}
      >
        {/* Mobile 把手 */}
        <div className="mx-auto my-2 h-1 w-10 rounded-full bg-gray-300 sm:hidden dark:bg-gray-600" />
        {title && (
          <p className="px-4 pt-1 pb-1 text-base font-semibold tracking-wider text-gray-400 uppercase sm:hidden dark:text-gray-500">
            {title}
          </p>
        )}
        {children}
        {/* Mobile 底部安全距離 */}
        <div className="h-4 sm:hidden" />
      </div>
    </>
  );
}
