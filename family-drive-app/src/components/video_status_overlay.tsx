type Props = {
  isLoading: boolean;
  hasError: boolean;
  loadingPercent: number | null;
  onRetry: () => void;
};

function Spinner() {
  return (
    <span
      className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-white"
      aria-hidden="true"
    />
  );
}

export function VideoStatusOverlay({ isLoading, hasError, loadingPercent, onRetry }: Props) {
  if (hasError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
        <p className="text-white/80">影片載入失敗，請重試</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-white/20 px-5 py-2 text-sm text-white backdrop-blur-sm"
        >
          重試
        </button>
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/18">
      <Spinner />
      <p className="rounded-full bg-black/40 px-4 py-1.5 text-lg font-bold text-white/90 backdrop-blur-sm">
        {loadingPercent !== null ? `載入中… ${loadingPercent}%` : "載入中…"}
      </p>
    </div>
  );
}