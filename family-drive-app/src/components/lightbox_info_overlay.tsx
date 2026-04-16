import { MdClose, MdFileDownload, MdZoomIn, MdZoomOut } from "react-icons/md";

import type { DriveFile } from "../types";

type Props = {
  currentSlideIndex: number;
  filesCount: number;
  file?: DriveFile;
  saving: boolean;
  showOverlay: boolean;
  zoomDisabled: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onClose: () => void;
  onDownload: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

function formatDate(iso?: string): string {
  if (!iso) {
    return "";
  }

  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatSize(size?: string): string {
  if (!size) {
    return "";
  }

  const bytes = parseInt(size, 10);

  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function IconOverlayButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className="pointer-events-auto rounded-full bg-black/45 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function LightboxInfoOverlay({
  currentSlideIndex,
  filesCount,
  file,
  saving,
  showOverlay,
  zoomDisabled,
  canZoomIn,
  canZoomOut,
  onClose,
  onDownload,
  onZoomIn,
  onZoomOut,
}: Props) {
  const sizeLabel = formatSize(file?.size);
  const dateLabel = formatDate(file?.createdTime);
  const counter = `${currentSlideIndex + 1} / ${filesCount}`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
        showOverlay ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconOverlayButton onClick={onDownload} label="儲存" disabled={saving}>
            {saving ? (
              <span className="block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <MdFileDownload className="h-6 w-6" />
            )}
          </IconOverlayButton>
          <IconOverlayButton onClick={onZoomIn} label="放大" disabled={zoomDisabled || !canZoomIn}>
            <MdZoomIn className="h-6 w-6" />
          </IconOverlayButton>
          <IconOverlayButton onClick={onZoomOut} label="縮小" disabled={zoomDisabled || !canZoomOut}>
            <MdZoomOut className="h-6 w-6" />
          </IconOverlayButton>
        </div>
        <IconOverlayButton onClick={onClose} label="關閉">
          <MdClose className="h-6 w-6" />
        </IconOverlayButton>
      </div>

      <div className="absolute right-0 bottom-14 left-0 flex items-end justify-between gap-3 px-4">
        <div className="max-w-[calc(100vw-7.5rem)] min-w-0 rounded-2xl bg-black/35 px-3 py-2 text-white/85 backdrop-blur-md sm:max-w-xl">
          {file?.name && (
            <p className="line-clamp-2 text-base leading-snug font-medium text-white">{file.name}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
            {sizeLabel && <span className="whitespace-nowrap">{sizeLabel}</span>}
            {dateLabel && <span className="whitespace-nowrap">{dateLabel}</span>}
          </div>
        </div>

        <div className="min-w-[5.5rem] rounded-2xl bg-black/35 px-3 py-2 text-center text-base text-white/85 backdrop-blur-md">
          <span className="whitespace-nowrap tabular-nums">{counter}</span>
        </div>
      </div>
    </div>
  );
}