import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./stores/auth_store";
import { useThemeStore } from "./stores/theme_store";
import { usePreferencesStore } from "./stores/preferences_store";
import { CookieBanner } from "./components/cookie_banner";
import { Header } from "./components/header";
import { PwaUpdateBanner } from "./components/pwa_update_banner";
import { useSwUpdate } from "./hooks/use_sw_update";

// Lazy load pages for code splitting
const LoginPage = lazy(() =>
  import("./pages/login_page").then((module) => ({ default: module.LoginPage })),
);
const AlbumPage = lazy(() =>
  import("./pages/album_page").then((module) => ({ default: module.AlbumPage })),
);
const PreferencesPage = lazy(() =>
  import("./pages/preferences_page").then((module) => ({ default: module.PreferencesPage })),
);
const TermsPage = lazy(() =>
  import("./pages/terms_page").then((module) => ({ default: module.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("./pages/privacy_page").then((module) => ({ default: module.PrivacyPage })),
);
const CookiePolicyPage = lazy(() =>
  import("./pages/cookie_policy_page").then((module) => ({ default: module.CookiePolicyPage })),
);

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
      <div className="border-primary-200 border-t-primary-500 h-12 w-12 animate-spin rounded-full border-4" />
      <p className="text-base text-gray-500 dark:text-gray-400">載入中...</p>
    </div>
  );
}

export function App() {
  const init = useAuthStore((s) => s.init);
  const firebaseReady = useAuthStore((s) => s.firebaseReady);
  const authenticating = useAuthStore((s) => s.authenticating);
  const user = useAuthStore((s) => s.user);
  const setTheme = useThemeStore((s) => s.setTheme);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const { updateReady, applyUpdate } = useSwUpdate();

  useEffect(() => {
    init();
  }, [init]);

  // 套用字體大小到根元素
  useEffect(
    function applyFontSize() {
      document.documentElement.style.fontSize = `${fontSize}px`;
    },
    [fontSize],
  );

  // 初始化主題
  useEffect(
    function initTheme() {
      // 從 localStorage 讀取或使用預設主題（system）
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // 預設為跟隨系統
        setTheme("system");
      }
    },
    [setTheme],
  );

  // 監聽系統主題變化
  useEffect(function watchSystemTheme() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = useThemeStore.getState().updateSystemTheme;

    const handleChange = () => {
      updateSystemTheme();
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // 顯示 loading：Firebase 初始化中或正在驗證用戶
  if (!firebaseReady || authenticating) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="border-primary-200 border-t-primary-500 h-12 w-12 animate-spin rounded-full border-4" />
        <p className="text-base text-gray-500 dark:text-gray-400">
          {!firebaseReady ? "努力取得照片中..." : "驗證登入資訊..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              user ? (
                <>
                  <Header />
                  <main className="flex-1">
                    <AlbumPage />
                  </main>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/preferences"
            element={user ? <PreferencesPage /> : <Navigate to="/login" replace />}
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <CookieBanner />
      {updateReady && <PwaUpdateBanner onUpdate={applyUpdate} />}
    </div>
  );
}
