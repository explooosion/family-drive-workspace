interface PwaUpdateBannerProps {
  onUpdate: () => void;
}

export function PwaUpdateBanner({ onUpdate }: PwaUpdateBannerProps) {
  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-800 px-5 py-3 shadow-lg dark:bg-gray-700">
      <span className="text-sm text-white">有新版本可用</span>
      <button
        onClick={onUpdate}
        className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors"
      >
        立即更新
      </button>
    </div>
  );
}
