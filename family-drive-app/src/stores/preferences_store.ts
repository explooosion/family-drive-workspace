import { create } from "zustand";

export type FontSize = 16 | 18 | 20;

type PreferencesState = {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  autoEnterAlbumOnCreate: boolean;
  setAutoEnterAlbumOnCreate: (value: boolean) => void;
  autoScrollUploadItem: boolean;
  setAutoScrollUploadItem: (value: boolean) => void;
};

const LS_FONT_SIZE = "pref_font_size";
const LS_AUTO_ENTER_ALBUM = "pref_auto_enter_album";
const LS_AUTO_SCROLL_UPLOAD = "pref_auto_scroll_upload";

function loadFontSize(): FontSize {
  const saved = localStorage.getItem(LS_FONT_SIZE);
  if (saved === "18") {
    return 18;
  }
  if (saved === "20") {
    return 20;
  }
  return 16;
}

function loadBool(key: string, defaultValue: boolean): boolean {
  const saved = localStorage.getItem(key);
  if (saved === null) {
    return defaultValue;
  }
  return saved === "true";
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  fontSize: loadFontSize(),
  setFontSize: (size) => {
    localStorage.setItem(LS_FONT_SIZE, String(size));
    set({ fontSize: size });
  },
  autoEnterAlbumOnCreate: loadBool(LS_AUTO_ENTER_ALBUM, true),
  setAutoEnterAlbumOnCreate: (value) => {
    localStorage.setItem(LS_AUTO_ENTER_ALBUM, String(value));
    set({ autoEnterAlbumOnCreate: value });
  },
  autoScrollUploadItem: loadBool(LS_AUTO_SCROLL_UPLOAD, true),
  setAutoScrollUploadItem: (value) => {
    localStorage.setItem(LS_AUTO_SCROLL_UPLOAD, String(value));
    set({ autoScrollUploadItem: value });
  },
}));
