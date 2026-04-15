import { create } from "zustand";

import type { Settings } from "../types";

type SettingsState = {
  settings: Settings;
};

export const useSettingsStore = create<SettingsState>(() => ({
  settings: {
    rootFolderName: "共享相簿",
    allowUpload: true,
    allowDelete: true,
  },
}));
