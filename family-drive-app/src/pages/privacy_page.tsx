import { MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { LEGAL_TITLE, LEGAL_CONTENT } from "../components/legal_modal";

export function PrivacyPage() {
  const navigate = useNavigate();

  function handleBack() {
    navigate(-1);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={handleBack} className="btn-icon text-xl" aria-label="返回">
            <MdArrowBack />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {LEGAL_TITLE["privacy"]}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {LEGAL_CONTENT["privacy"]}
        </p>
      </main>
    </div>
  );
}
