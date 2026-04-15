import React from "react";
import { MdClose } from "react-icons/md";

interface MobileSheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * 通用 Mobile-First 彈窗容器：
 * - Mobile (< sm)：底部滑出 sheet
 * - Desktop (≥ sm)：置中彈窗
 * 內容區塊由 children 自行定義
 */
export function MobileSheet({ title, onClose, children }: MobileSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white sm:rounded-2xl dark:bg-[#242526]">
        {/* Mobile 把手 */}
        <div className="mx-auto my-3 h-1 w-10 rounded-full bg-gray-300 sm:hidden dark:bg-gray-600" />
        {/* 標題列 */}
        <div className="flex items-center justify-between px-4 pt-2 pb-2 sm:pt-5">
          <h2 className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="關閉">
            <MdClose className="text-xl" />
          </button>
        </div>
        {/* 內容 */}
        {children}
      </div>
    </div>
  );
}
