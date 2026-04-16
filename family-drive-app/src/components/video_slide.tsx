import { useState } from "react";

import { getWorkerVideoUrl } from "../utils/drive_api/url_helpers";
import { useAuthStore } from "../stores/auth_store";
import { VideoPlayer } from "./video_player";

type VideoSlideProps = {
  fileId: string;
  poster?: string;
  name: string;
  isActive: boolean;
  showOverlay: boolean;
  onOverlayVisibilityChange: (visible: boolean) => void;
};

export function VideoSlide({
  fileId,
  poster,
  name,
  isActive,
  showOverlay,
  onOverlayVisibilityChange,
}: VideoSlideProps) {
  const [playing, setPlaying] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const src = getWorkerVideoUrl(fileId, accessToken ?? undefined);

  if (playing) {
    return (
      <VideoPlayer
        src={src}
        poster={poster}
        name={name}
        isActive={isActive}
        showOverlay={showOverlay}
        onOverlayVisibilityChange={onOverlayVisibilityChange}
      />
    );
  }

  return (
    <div
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black"
      onClick={() => onOverlayVisibilityChange(!showOverlay)}
    >
      {poster && (
        <img
          src={poster}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain opacity-40"
        />
      )}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setPlaying(true);
          }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
          aria-label="播放影片"
        >
          <svg
            className="ml-1.5 h-10 w-10 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <p className="text-sm text-white/70">點擊播放影片</p>
      </div>
    </div>
  );
}
