import { useState, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import { MdClose, MdFileDownload, MdZoomIn, MdZoomOut } from "react-icons/md";

import type { DriveFile } from "../types";
import { useAuthStore } from "../stores/auth_store";
import { isVideoMime, getThumbnailUrl } from "../services/google_drive";
import { useHdImage } from "../hooks/use_hd_image";
import { useSaveImage } from "../hooks/use_save_image";
import { VideoSlide } from "./video_slide";

const HD_DELAY_LIGHTBOX = 500;

type DriveVideoSlide = {
  type: "drive-video";
  src: string;
  driveFileId: string;
  drivePoster?: string;
  driveName: string;
};

type DriveImageSlide = {
  type: "drive-image";
  src: string;
  alt: string;
};

declare module "yet-another-react-lightbox" {
  interface SlideTypes {
    "drive-image": DriveImageSlide;
    "drive-video": DriveVideoSlide;
  }
}

type Props = {
  files: DriveFile[];
  initialIndex: number;
  onClose: () => void;
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

function ImageSlide({ src, alt }: { src: string; alt: string }) {
  const { displaySrc, containerRef } = useHdImage(src, !!src, HD_DELAY_LIGHTBOX);
  return (
    <div
      ref={containerRef}
      className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black"
    >
      <img
        src={displaySrc}
        alt={alt}
        draggable={false}
        className="h-full w-full object-contain select-none"
      />
    </div>
  );
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

export function MediaLightbox({ files, initialIndex, onClose }: Props) {
  const token = useAuthStore((s) => s.accessToken) ?? "";
  const { saving, saveImage } = useSaveImage(token);
  const currentIndexRef = useRef(initialIndex);
  const zoomRef = useRef<{
    zoom: number;
    minZoom: number;
    maxZoom: number;
    offsetX: number;
    offsetY: number;
    disabled: boolean;
    zoomIn: () => void;
    zoomOut: () => void;
    changeZoom: (targetZoom: number, rapid?: boolean, dx?: number, dy?: number) => void;
  } | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialIndex);
  const [videoConfirmFile, setVideoConfirmFile] = useState<DriveFile | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [zoomState, setZoomState] = useState({
    zoom: 1,
    minZoom: 1,
    maxZoom: 1,
    disabled: true,
  });

  const slides: Array<DriveVideoSlide | DriveImageSlide> = files.map((file) => {
    if (isVideoMime(file.mimeType)) {
      return {
        type: "drive-video",
        driveFileId: file.id,
        drivePoster: file.thumbnailLink ?? undefined,
        driveName: file.name,
        src: "",
      };
    }
    return {
      type: "drive-image",
      src: getThumbnailUrl(file, token),
      alt: file.name,
    };
  });

  function syncZoomState() {
    const instance = zoomRef.current;
    if (!instance) {
      setZoomState({ zoom: 1, minZoom: 1, maxZoom: 1, disabled: true });
      return;
    }
    setZoomState({
      zoom: instance.zoom,
      minZoom: instance.minZoom,
      maxZoom: instance.maxZoom,
      disabled: instance.disabled,
    });
  }

  function handleDownload() {
    const file = files[currentIndexRef.current];
    if (!file) {
      return;
    }
    if (isVideoMime(file.mimeType)) {
      setVideoConfirmFile(file);
      return;
    }
    void saveImage(file);
  }

  function handleSlideClick() {
    if (window.innerWidth < 1024) {
      setShowOverlay((prev) => !prev);
    }
  }

  return (
    <>
      {videoConfirmFile && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <p className="mb-1 text-base font-semibold text-gray-900 dark:text-white">下載影片？</p>
            <p className="mb-5 text-base text-gray-500 dark:text-gray-400">
              {videoConfirmFile.name}
              {videoConfirmFile.size && (
                <span className="ml-1">
                  （{(parseInt(videoConfirmFile.size, 10) / 1024 / 1024).toFixed(1)} MB）
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVideoConfirmFile(null)}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-base font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveImage(videoConfirmFile);
                  setVideoConfirmFile(null);
                }}
                className="bg-primary-500 hover:bg-primary-600 flex-1 rounded-xl py-2.5 text-base font-medium text-white"
              >
                確定下載
              </button>
            </div>
          </div>
        </div>
      )}
      <Lightbox
        open={true}
        close={onClose}
        slides={slides}
        index={initialIndex}
        plugins={[Captions, Zoom]}
        on={{
          view: ({ index }) => {
            currentIndexRef.current = index;
            setCurrentSlideIndex(index);
            queueMicrotask(syncZoomState);
          },
          click: handleSlideClick,
          zoom: syncZoomState,
        }}
        zoom={{
          ref: zoomRef,
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
          supports: ["drive-image"],
        }}
        carousel={{ padding: 0, spacing: 0 }}
        toolbar={{ buttons: [] }}
        render={{
          buttonZoom: () => null,
          controls: () => {
            const file = files[currentSlideIndex];
            const sizeKb = file?.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : "";
            const dateStr = formatDate(file?.createdTime);
            const counter = `${currentSlideIndex + 1} / ${files.length}`;
            return (
              <div
                className={`pointer-events-none absolute inset-0 transition-opacity duration-300 lg:opacity-100 ${
                  showOverlay ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IconOverlayButton onClick={handleDownload} label="儲存" disabled={saving}>
                      {saving ? (
                        <span className="block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <MdFileDownload className="h-6 w-6" />
                      )}
                    </IconOverlayButton>
                    <IconOverlayButton
                      onClick={() => zoomRef.current?.zoomIn()}
                      label="放大"
                      disabled={zoomState.disabled || zoomState.zoom >= zoomState.maxZoom}
                    >
                      <MdZoomIn className="h-6 w-6" />
                    </IconOverlayButton>
                    <IconOverlayButton
                      onClick={() => zoomRef.current?.zoomOut()}
                      label="縮小"
                      disabled={zoomState.disabled || zoomState.zoom <= zoomState.minZoom}
                    >
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
                      <p className="line-clamp-2 text-base leading-snug font-medium text-white">
                        {file.name}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
                      {sizeKb && <span className="whitespace-nowrap">{sizeKb}</span>}
                      {dateStr && <span className="whitespace-nowrap">{dateStr}</span>}
                    </div>
                  </div>
                  <div className="min-w-[5.5rem] rounded-2xl bg-black/35 px-3 py-2 text-center text-base text-white/85 backdrop-blur-md">
                    <span className="whitespace-nowrap tabular-nums">{counter}</span>
                  </div>
                </div>
              </div>
            );
          },
          slide: ({ slide, offset }) => {
            if (slide.type === "drive-video") {
              return (
                <VideoSlide
                  fileId={slide.driveFileId}
                  poster={slide.drivePoster}
                  name={slide.driveName}
                  isActive={offset === 0}
                  showOverlay={showOverlay}
                />
              );
            }
            if (slide.type === "drive-image") {
              return <ImageSlide src={slide.src} alt={slide.alt} />;
            }
            return undefined;
          },
        }}
      />
    </>
  );
}
