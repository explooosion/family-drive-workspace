import { useState } from "react";

import { MdClose } from "react-icons/md";

type CookiePreferences = {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

type CookieSettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
};

function ToggleRow({ label, description, checked, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none ${
          checked ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function loadPreferences(): CookiePreferences {
  try {
    const raw = localStorage.getItem("cookie-preferences");
    if (raw) {
      return JSON.parse(raw) as CookiePreferences;
    }
  } catch {
    // ignore parse errors
  }
  return { functional: true, analytics: true, marketing: true };
}

export function CookieSettingsModal({ open, onClose }: CookieSettingsModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [prefs, setPrefs] = useState<CookiePreferences>(loadPreferences);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setPrefs(loadPreferences());
    }
  }

  function handleToggle(key: keyof CookiePreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    localStorage.setItem("cookie-consent-decided", "true");
    localStorage.setItem("cookie-preferences", JSON.stringify(prefs));
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cookie 設定</h2>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="關閉">
            <MdClose className="text-xl" />
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          選擇您願意允許的 Cookie 類型。必要 Cookie 無法關閉，因為它們是網站正常運作所必需的。
        </p>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">必要 Cookie</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                維持網站基本功能，無法關閉。
              </p>
            </div>
            <span className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 mt-0.5 rounded-full px-3 py-1 text-xs font-medium">
              永遠開啟
            </span>
          </div>
          <ToggleRow
            label="功能性 Cookie"
            description="記住您的偏好設定，例如語言與主題。"
            checked={prefs.functional}
            onToggle={() => handleToggle("functional")}
          />
          <ToggleRow
            label="分析 Cookie"
            description="幫助我們了解您如何使用本網站，以便持續改善。"
            checked={prefs.analytics}
            onToggle={() => handleToggle("analytics")}
          />
          <ToggleRow
            label="行銷 Cookie"
            description="用於提供個人化內容與廣告。"
            checked={prefs.marketing}
            onToggle={() => handleToggle("marketing")}
          />
        </div>
        <div className="mt-6">
          <button type="button" onClick={handleSave} className="btn-primary w-full">
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
}
