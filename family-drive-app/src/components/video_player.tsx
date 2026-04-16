import { useState, useRef, useEffect } from "react";

import { VideoPlayerControls } from "./video_player_controls";
import { VideoStatusOverlay } from "./video_status_overlay";

type VideoInset = { bottom: number; horizontal: number };

type Props = {
  src: string;
  poster?: string;
  name: string;
  isActive: boolean;
  showOverlay: boolean;
  onOverlayVisibilityChange: (visible: boolean) => void;
};

const HIDE_DELAY_MS = 3000;

function calcVideoInset(vid: HTMLVideoElement): VideoInset {
  const { videoWidth, videoHeight } = vid;
  if (!videoWidth || !videoHeight) {
    return { bottom: 0, horizontal: 0 };
  }
  const cW = window.innerWidth;
  const cH = window.innerHeight;
  if (videoWidth / videoHeight > cW / cH) {
    // wider than container → letterbox (black bars top & bottom)
    const renderedH = cW * (videoHeight / videoWidth);
    return { bottom: (cH - renderedH) / 2, horizontal: 0 };
  }
  // taller/equal → pillarbox (black bars left & right)
  const renderedW = cH * (videoWidth / videoHeight);
  return { bottom: 0, horizontal: (cW - renderedW) / 2 };
}

export function VideoPlayer({
  src,
  poster,
  name,
  isActive,
  showOverlay,
  onOverlayVisibilityChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverControlsRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [inset, setInset] = useState<VideoInset>({ bottom: 0, horizontal: 0 });
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(
    function pauseWhenInactive() {
      if (!isActive) {
        videoRef.current?.pause();
      }
    },
    [isActive],
  );

  useEffect(
    function manageHideTimer() {
      if (!playing) {
        cancelHide();
        setControlsVisible(true);
      } else {
        scheduleHide();
      }
      return cancelHide;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playing],
  );

  useEffect(function attachResizeListener() {
    function onResize() {
      const vid = videoRef.current;
      if (vid) {
        setInset(calcVideoInset(vid));
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function cancelHide() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function scheduleHide() {
    cancelHide();
    if (isOverControlsRef.current) {
      return;
    }
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY_MS);
  }

  function revealControls() {
    if (videoLoading || videoError) {
      return;
    }

    setControlsVisible(true);
    if (playing) {
      scheduleHide();
    }
  }

  function togglePlay() {
    const vid = videoRef.current;
    if (!vid) {
      return;
    }
    if (vid.paused) {
      vid.play();
    } else {
      vid.pause();
    }
  }

  function handleVideoAreaClick() {
    if (isOverControlsRef.current) {
      return;
    }

    const renderedControlsVisible = controlsVisible && !videoLoading && !videoError;
    const nextVisible = !(renderedControlsVisible || showOverlay);
    onOverlayVisibilityChange(nextVisible);

    if (!nextVisible) {
      cancelHide();
      setControlsVisible(false);
    } else {
      setControlsVisible(!videoLoading && !videoError);
      if (playing) {
        scheduleHide();
      }
    }
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    const vid = videoRef.current;
    if (!vid) {
      return;
    }
    const t = Number(e.target.value);
    vid.currentTime = t;
    setCurrentTime(t);
  }

  function handleVideoError() {
    console.error("[VideoPlayer] video playback failed", {
      name,
    });
    setVideoError(true);
    setVideoLoading(false);
    setPlaying(false);
  }

  function handleRetry() {
    setVideoError(false);
    setVideoLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setRetryCount((c) => c + 1);
  }

  function handleSeekPointerDown() {
    cancelHide();
    setControlsVisible(true);
  }

  function handleSeekPointerUp() {
    // Reset hide timer after seek — fixes the "controls hide on seek" bug
    if (playing) {
      scheduleHide();
    }
  }

  function handleControlsMouseEnter() {
    isOverControlsRef.current = true;
    cancelHide();
    setControlsVisible(true);
  }

  function handleControlsMouseLeave() {
    isOverControlsRef.current = false;
    if (playing) {
      scheduleHide();
    }
  }

  const insetStyle: React.CSSProperties = {
    bottom: inset.bottom,
    left: inset.horizontal,
    right: inset.horizontal,
  };

  return (
    <div
      className="relative h-screen w-screen bg-black"
      style={{ cursor: controlsVisible && !videoLoading && !videoError ? "default" : "none" }}
      onMouseMove={revealControls}
      onClick={handleVideoAreaClick}
    >
      <video
        key={retryCount}
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        muted={muted}
        poster={poster}
        className="h-screen w-screen object-contain"
        aria-label={name}
        onLoadStart={() => setVideoLoading(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={handleVideoError}
        onWaiting={() => setVideoLoading(true)}
        onPlaying={() => {
          setPlaying(true);
          setVideoLoading(false);
        }}
        onSeeking={() => setVideoLoading(true)}
        onSeeked={() => setVideoLoading(false)}
        onTimeUpdate={() => {
          if (!videoRef.current?.seeking) {
            setCurrentTime(videoRef.current?.currentTime ?? 0);
          }
        }}
        onLoadedMetadata={() => {
          const vid = videoRef.current;
          if (!vid) {
            return;
          }
          setDuration(vid.duration);
          setInset(calcVideoInset(vid));
          setVideoLoading(false);
        }}
      />

      {/* Controls overlay — pointer-events-none so clicks pass through to video */}
      <VideoPlayerControls
        currentTime={currentTime}
        duration={duration}
        insetStyle={insetStyle}
        muted={muted}
        playing={playing}
        visible={controlsVisible && !videoLoading && !videoError}
        onControlsMouseEnter={handleControlsMouseEnter}
        onControlsMouseLeave={handleControlsMouseLeave}
        onSeekChange={handleSeekChange}
        onSeekPointerDown={handleSeekPointerDown}
        onSeekPointerUp={handleSeekPointerUp}
        onToggleMuted={() => setMuted((value) => !value)}
        onTogglePlay={togglePlay}
      />

      <VideoStatusOverlay isLoading={videoLoading} hasError={videoError} onRetry={handleRetry} />
    </div>
  );
}
