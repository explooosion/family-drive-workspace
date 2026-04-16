import type { CSSProperties } from "react";
import { MdPause, MdPlayArrow, MdVolumeOff, MdVolumeUp } from "react-icons/md";

type Props = {
  currentTime: number;
  duration: number;
  insetStyle: CSSProperties;
  muted: boolean;
  playing: boolean;
  visible: boolean;
  onControlsMouseEnter: () => void;
  onControlsMouseLeave: () => void;
  onSeekChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSeekPointerDown: () => void;
  onSeekPointerUp: () => void;
  onToggleMuted: () => void;
  onTogglePlay: () => void;
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function VideoPlayerControls({
  currentTime,
  duration,
  insetStyle,
  muted,
  playing,
  visible,
  onControlsMouseEnter,
  onControlsMouseLeave,
  onSeekChange,
  onSeekPointerDown,
  onSeekPointerUp,
  onToggleMuted,
  onTogglePlay,
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="absolute h-28 bg-gradient-to-t from-black/75 to-transparent"
        style={insetStyle}
      />
      <div
        className="pointer-events-auto absolute px-4 pb-3"
        style={insetStyle}
        onMouseEnter={onControlsMouseEnter}
        onMouseLeave={onControlsMouseLeave}
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.5}
          value={currentTime}
          onChange={onSeekChange}
          onPointerDown={onSeekPointerDown}
          onPointerUp={onSeekPointerUp}
          className="w-full cursor-pointer accent-white"
          style={{ height: "4px" }}
          aria-label="影片進度"
        />

        <div className="mt-1.5 flex items-center gap-3">
          <button type="button" onClick={onTogglePlay} className="text-white" aria-label={playing ? "暫停" : "播放"}>
            {playing ? <MdPause className="text-2xl" /> : <MdPlayArrow className="text-2xl" />}
          </button>
          <span className="text-sm text-white/90 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex-1" />
          <button type="button" onClick={onToggleMuted} className="text-white" aria-label={muted ? "取消靜音" : "靜音"}>
            {muted ? <MdVolumeOff className="text-2xl" /> : <MdVolumeUp className="text-2xl" />}
          </button>
        </div>
      </div>
    </div>
  );
}