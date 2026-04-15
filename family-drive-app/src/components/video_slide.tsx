import { useState } from "react";

import { getWorkerVideoUrl } from "../utils/drive_api/url_helpers";
import { VideoPlayer } from "./video_player";

type VideoSlideProps = {
  fileId: string;
  poster?: string;
  name: string;
  isActive: boolean;
  showOverlay: boolean;
};

export function VideoSlide({ fileId, poster, name, isActive, showOverlay }: VideoSlideProps) {
  const [playing, setPlaying] = useState(false);
  const src = getWorkerVideoUrl(fileId);

  if (playing) {
    return <VideoPlayer src={src} poster={poster} name={name} isActive={isActive} />;
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      {poster && (
        <img
          src={poster}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain opacity-40"
        />
      )}
      <div
        className={`relative z-10 flex flex-col items-center gap-3 transition-opacity duration-300 lg:opacity-100 ${
          showOverlay ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setPlaying(true)}
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
