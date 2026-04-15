import { useState, useRef, useEffect } from "react";
import { MdPlayArrow, MdPause, MdVolumeUp, MdVolumeOff } from "react-icons/md";

type VideoInset = { bottom: number; horizontal: number };

type Props = {
  src: string;
  poster?: string;
  name: string;
  isActive: boolean;
};

const HIDE_DELAY_MS = 3000;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

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

export function VideoPlayer({ src, poster, name, isActive }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverControlsRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [inset, setInset] = useState<VideoInset>({ bottom: 0, horizontal: 0 });
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
    if (controlsVisible) {
      cancelHide();
      setControlsVisible(false);
    } else {
      setControlsVisible(true);
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
    setPlaying(false);
  }

  function handleRetry() {
    setVideoError(false);
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
      style={{ cursor: controlsVisible ? "default" : "none" }}
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
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={handleVideoError}
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
        }}
      />

      {/* Controls overlay — pointer-events-none so clicks pass through to video */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Gradient scrim at video bottom */}
        <div
          className="absolute h-28 bg-gradient-to-t from-black/75 to-transparent"
          style={insetStyle}
        />

        {/* Controls bar — pointer-events-auto */}
        <div
          className="pointer-events-auto absolute px-4 pb-3"
          style={insetStyle}
          onMouseEnter={handleControlsMouseEnter}
          onMouseLeave={handleControlsMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seek bar */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.5}
            value={currentTime}
            onChange={handleSeekChange}
            onPointerDown={handleSeekPointerDown}
            onPointerUp={handleSeekPointerUp}
            className="w-full cursor-pointer accent-white"
            style={{ height: "4px" }}
            aria-label="影片進度"
          />

          {/* Buttons row */}
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="text-white"
              aria-label={playing ? "暫停" : "播放"}
            >
              {playing ? <MdPause className="text-2xl" /> : <MdPlayArrow className="text-2xl" />}
            </button>
            <span className="text-sm text-white/90 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="text-white"
              aria-label={muted ? "取消靜音" : "靜音"}
            >
              {muted ? <MdVolumeOff className="text-2xl" /> : <MdVolumeUp className="text-2xl" />}
            </button>
          </div>
        </div>
      </div>

      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
          <p className="text-white/80">影片載入失敗，請重試</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-white/20 px-5 py-2 text-sm text-white backdrop-blur-sm"
          >
            重試
          </button>
        </div>
      )}
    </div>
  );
}
