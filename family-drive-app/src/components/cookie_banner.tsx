import { useState } from "react";

import { CookieSettingsModal } from "./cookie_settings_modal";

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem("cookie-consent-decided"));
  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleAcceptAll() {
    localStorage.setItem("cookie-consent-decided", "true");
    localStorage.setItem(
      "cookie-preferences",
      JSON.stringify({ functional: true, analytics: true, marketing: true }),
    );
    setVisible(false);
  }

  function handleRejectAll() {
    localStorage.setItem("cookie-consent-decided", "true");
    localStorage.setItem(
      "cookie-preferences",
      JSON.stringify({ functional: false, analytics: false, marketing: false }),
    );
    setVisible(false);
  }

  function handleOpenSettings() {
    setSettingsOpen(true);
  }

  function handleCloseSettings() {
    setSettingsOpen(false);
    setVisible(false);
  }

  return (
    <>
      {visible && (
        <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-screen-md">
            <p className="mb-1 font-semibold text-gray-900 dark:text-white">我們使用 Cookie</p>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              我們使用 Cookie 來提供最佳的瀏覽體驗。您可以接受所有 Cookie，或自訂您的偏好設定。
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleAcceptAll} className="btn-primary">
                接受全部
              </button>
              <button type="button" onClick={handleRejectAll} className="btn-secondary">
                僅限必要
              </button>
              <button type="button" onClick={handleOpenSettings} className="btn-secondary">
                Cookie 設定
              </button>
            </div>
          </div>
        </div>
      )}
      <CookieSettingsModal open={settingsOpen} onClose={handleCloseSettings} />
    </>
  );
}
