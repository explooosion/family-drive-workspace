import { useState, useRef, useMemo } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import type { DriveFile } from "../types";
import { useAuthStore } from "../stores/auth_store";
import { isVideoMime, getWorkerThumbnailUrl } from "../services/google_drive";
import { useSaveImage } from "../hooks/use_save_image";
import { LightboxInfoOverlay } from "./lightbox_info_overlay";
import { VideoSlide } from "./video_slide";

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

function ImageSlide({
  src,
  alt,
  showOverlay,
  onOverlayVisibilityChange,
}: {
  src: string;
  alt: string;
  showOverlay: boolean;
  onOverlayVisibilityChange: (visible: boolean) => void;
}) {
  return (
    <div
      className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black"
      onClick={() => onOverlayVisibilityChange(!showOverlay)}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-contain select-none"
      />
    </div>
  );
}

export function MediaLightbox({ files, initialIndex, onClose }: Props) {
  const token = useAuthStore((s) => s.accessToken);
  const { saving, saveImage } = useSaveImage();
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

  const isCurrentVideo = isVideoMime(files[currentSlideIndex]?.mimeType ?? "");

  const slides = useMemo<Array<DriveVideoSlide | DriveImageSlide>>(
    () =>
      files.map((file) => {
        const HD_SIZE = 2000;
        if (isVideoMime(file.mimeType)) {
          return {
            type: "drive-video",
            driveFileId: file.id,
            drivePoster: token
              ? getWorkerThumbnailUrl(file.id, token, HD_SIZE)
              : file.thumbnailLink ?? undefined,
            driveName: file.name,
            src: "",
          };
        }
        return {
          type: "drive-image",
          src: token ? getWorkerThumbnailUrl(file.id, token, HD_SIZE) : file.thumbnailLink ?? "",
          alt: file.name,
        };
      }),
    [files, token],
  );

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
          zoom: syncZoomState,
        }}
        zoom={{
          ref: zoomRef,
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
          supports: ["drive-image"],
        }}
        carousel={{ padding: 0, spacing: 0, preload: isCurrentVideo ? 0 : 2 }}
        toolbar={{ buttons: [] }}
        render={{
          buttonZoom: () => null,
          controls: () => (
            <LightboxInfoOverlay
              currentSlideIndex={currentSlideIndex}
              filesCount={files.length}
              file={files[currentSlideIndex]}
              saving={saving}
              showOverlay={showOverlay}
              zoomDisabled={zoomState.disabled}
              canZoomIn={zoomState.zoom < zoomState.maxZoom}
              canZoomOut={zoomState.zoom > zoomState.minZoom}
              onClose={onClose}
              onDownload={handleDownload}
              onZoomIn={() => zoomRef.current?.zoomIn()}
              onZoomOut={() => zoomRef.current?.zoomOut()}
            />
          ),
          slide: ({ slide, offset }) => {
            if (slide.type === "drive-video") {
              return (
                <VideoSlide
                  fileId={slide.driveFileId}
                  poster={slide.drivePoster}
                  name={slide.driveName}
                  isActive={offset === 0}
                  showOverlay={showOverlay}
                  onOverlayVisibilityChange={setShowOverlay}
                />
              );
            }
            if (slide.type === "drive-image") {
              return (
                <ImageSlide
                  src={slide.src}
                  alt={slide.alt}
                  showOverlay={showOverlay}
                  onOverlayVisibilityChange={setShowOverlay}
                />
              );
            }
            return undefined;
          },
        }}
      />
    </>
  );
}
