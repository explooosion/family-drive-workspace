import { useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

import type { FontSize } from "../stores/preferences_store";
import { usePreferencesStore } from "../stores/preferences_store";

type FontOption = {
  value: FontSize;
  label: string;
  description: string;
};

const FONT_OPTIONS: FontOption[] = [
  { value: 16, label: "標準", description: "16px" },
  { value: 18, label: "大", description: "18px" },
  { value: 20, label: "特大", description: "20px" },
];

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex flex-col gap-0.5 pr-4">
        <span className="text-base font-medium text-gray-900 dark:text-white">{label}</span>
        <span className="text-base text-gray-500 dark:text-gray-400">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function PreferencesPage() {
  const navigate = useNavigate();
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);
  const autoEnterAlbumOnCreate = usePreferencesStore((s) => s.autoEnterAlbumOnCreate);
  const setAutoEnterAlbumOnCreate = usePreferencesStore((s) => s.setAutoEnterAlbumOnCreate);
  const autoScrollUploadItem = usePreferencesStore((s) => s.autoScrollUploadItem);
  const setAutoScrollUploadItem = usePreferencesStore((s) => s.setAutoScrollUploadItem);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 頁首 */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-white px-4 shadow-sm dark:bg-gray-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="返回"
        >
          <MdArrowBack className="text-2xl" />
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white">偏好設定</h1>
      </header>

      {/* 設定項目 */}
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        {/* 字體大小 */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">字體大小</h2>
            <p className="text-base text-gray-500 dark:text-gray-400">調整應用程式的文字顯示大小</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFontSize(opt.value)}
                className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700/50 dark:active:bg-gray-700"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-base font-medium text-gray-900 dark:text-white">
                    {opt.label}
                  </span>
                  <span className="text-base text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </span>
                </div>
                <span
                  className={`h-5 w-5 rounded-full border-2 transition-colors ${
                    fontSize === opt.value
                      ? "border-primary-600 bg-primary-600"
                      : "border-gray-300 bg-transparent dark:border-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>
        </section>

        {/* 相簿行為 */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">相簿行為</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleRow
              label="建立相簿後自動進入"
              description="建立新相簿後自動導航至該相簿"
              checked={autoEnterAlbumOnCreate}
              onChange={setAutoEnterAlbumOnCreate}
            />
          </div>
        </section>

        {/* 上傳行為 */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">上傳行為</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleRow
              label="自動捲動至上傳中項目"
              description="上傳時自動捲動清單以顯示目前上傳的檔案"
              checked={autoScrollUploadItem}
              onChange={setAutoScrollUploadItem}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
