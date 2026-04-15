import { create } from "zustand";

type ThemeMode = "light" | "dark" | "system";

type ThemeState = {
  mode: ThemeMode;
  actualMode: "light" | "dark"; // 實際應用的模式
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  updateSystemTheme: () => void;
};

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: "light" | "dark") {
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeState>((setState, getState) => ({
  mode: (localStorage.getItem("theme") as ThemeMode) || "system",
  actualMode: getSystemTheme(),

  toggleTheme() {
    const { mode } = getState();
    let newMode: ThemeMode;

    if (mode === "light") {
      newMode = "dark";
    } else if (mode === "dark") {
      newMode = "system";
    } else {
      newMode = "light";
    }

    getState().setTheme(newMode);
  },

  setTheme(mode: ThemeMode) {
    localStorage.setItem("theme", mode);

    const actualMode = mode === "system" ? getSystemTheme() : mode;
    applyTheme(actualMode);

    setState({ mode, actualMode });
  },

  updateSystemTheme() {
    const { mode } = getState();
    if (mode === "system") {
      const actualMode = getSystemTheme();
      applyTheme(actualMode);
      setState({ actualMode });
    }
  },
}));
