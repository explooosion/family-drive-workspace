import { MdClose } from "react-icons/md";

export type LegalType = "terms" | "privacy" | "cookie-policy";

type LegalModalProps = {
  type: LegalType | null;
  onClose: () => void;
};

const LEGAL_TITLE: Record<LegalType, string> = {
  terms: "服務條款",
  privacy: "隱私政策",
  "cookie-policy": "Cookie 政策",
};

const LEGAL_CONTENT: Record<LegalType, string> = {
  terms: [
    "本服務「Family Drive Gallery」僅供受邀成員使用。",
    "",
    "1. 使用限制",
    "帳號由管理員統一邀請建立。未經授權的存取或分享帳號，將導致帳號被終止。",
    "",
    "2. 內容所有權",
    "上傳的所有照片與影片，版權歸原始上傳者所有。本服務不對任何內容主張所有權。",
    "",
    "3. 內容使用",
    "存儲的內容僅供家庭成員個人檢視。未經其他成員同意，不得分享至第三方或公開平台。",
    "",
    "4. 服務可用性",
    "本服務依現狀提供，不保證 100% 不間斷運作。重要照片請自行備份。",
    "",
    "5. 修改條款",
    "管理員保留隨時修改本條款的權利。繼續使用即表示接受修改後的條款。",
    "",
    "最後更新：2026 年 4 月",
  ].join("\n"),
  privacy: [
    "本政策說明「Family Drive Gallery」如何收集、使用及保護您的個人資料。",
    "",
    "1. 收集的資料",
    "・帳號資訊：Google 帳號的姓名、電子郵件及頭像（透過 Firebase Authentication）",
    "・使用資料：您上傳的照片與影片，以及相關資料夾結構",
    "・使用偏好：主題模式、字體大小等本地設定",
    "",
    "2. 資料使用方式",
    "收集的資料僅用於驗證身份、顯示個人資料，以及儲存和組織媒體內容。",
    "",
    "3. 資料儲存",
    "媒體內容儲存於 Google Drive，帳號資料儲存於 Firebase Firestore。所有資料均由 Google 的安全基礎設施保護。",
    "",
    "4. 資料分享",
    "我們不會將您的個人資料出售或分享給第三方，除非法律要求。",
    "",
    "5. 您的權利",
    "您可以隨時要求管理員查看、修改或刪除您的帳號資料。",
    "",
    "最後更新：2026 年 4 月",
  ].join("\n"),
  "cookie-policy": [
    "本政策說明「Family Drive Gallery」如何使用 Cookie 及類似技術。",
    "",
    "什麼是 Cookie？",
    "Cookie 是儲存在您裝置上的小型文字檔案，幫助網站記住您的偏好設定並改善使用體驗。",
    "",
    "我們使用的 Cookie 類型",
    "",
    "1. 必要 Cookie",
    "網站正常運作所必需，無法關閉。包括身份驗證 Token 及安全性 Cookie。",
    "",
    "2. 功能性 Cookie",
    "記住您的偏好，例如主題模式（深色／淺色）及字體大小。",
    "",
    "3. 分析 Cookie",
    "幫助我們了解網站使用狀況，以便持續改善使用者體驗。",
    "",
    "4. 行銷 Cookie",
    "目前本服務不使用任何行銷 Cookie。",
    "",
    "管理 Cookie",
    "您可透過選單中的「Cookie 設定」隨時調整偏好，或透過瀏覽器設定刪除所有 Cookie。",
    "",
    "最後更新：2026 年 4 月",
  ].join("\n"),
};

export { LEGAL_TITLE, LEGAL_CONTENT };

export function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{LEGAL_TITLE[type]}</h2>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="關閉">
            <MdClose className="text-xl" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-600 dark:text-gray-300">
            {LEGAL_CONTENT[type]}
          </p>
        </div>
      </div>
    </div>
  );
}
