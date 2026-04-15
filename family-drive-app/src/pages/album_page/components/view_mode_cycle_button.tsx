import { MdGridView, MdViewList, MdViewModule, MdViewComfy, MdTableRows } from "react-icons/md";

import { useDriveStore } from "../../../stores/drive_store";

type ViewMode = "large" | "medium" | "small" | "list" | "detail";

const VIEW_CYCLE: ViewMode[] = ["large", "medium", "small", "list", "detail"];

const VIEW_ICONS: Record<ViewMode, React.ReactNode> = {
  large: <MdViewComfy />,
  medium: <MdGridView />,
  small: <MdViewModule />,
  list: <MdViewList />,
  detail: <MdTableRows />,
};

const VIEW_LABELS: Record<ViewMode, string> = {
  large: "大縮圖",
  medium: "中縮圖",
  small: "小縮圖",
  list: "列表",
  detail: "詳細清單",
};

export function ViewModeCycleButton() {
  const viewMode = useDriveStore((s) => s.viewMode);
  const setViewMode = useDriveStore((s) => s.setViewMode);

  function handleClick() {
    const idx = VIEW_CYCLE.indexOf(viewMode);
    const nextMode = VIEW_CYCLE[(idx + 1) % VIEW_CYCLE.length];
    setViewMode(nextMode);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn-icon text-xl"
      aria-label={`顯示模式：${VIEW_LABELS[viewMode]}，點擊切換`}
      title={VIEW_LABELS[viewMode]}
    >
      {VIEW_ICONS[viewMode]}
    </button>
  );
}
