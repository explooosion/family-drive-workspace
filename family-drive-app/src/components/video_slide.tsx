import { useEffect, useState } from "react";

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
  const [playing, setPlaying] = useState(isActive);
  const accessToken = useAuthStore((s) => s.accessToken);
  const src = getWorkerVideoUrl(fileId, accessToken ?? undefined);

  useEffect(() => {
    setPlaying(isActive);
  }, [isActive]);

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
    </div>
  );
}
