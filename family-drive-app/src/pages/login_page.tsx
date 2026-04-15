import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MdAccountCircle, MdPhotoLibrary, MdCloudQueue, MdLock } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";

import { useAuthStore } from "../stores/auth_store";

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  useEffect(
    function redirectIfAlreadyLoggedIn() {
      if (user) {
        navigate("/");
      }
    },
    [user, navigate],
  );

  function handleLogin() {
    login();
  }

  return (
    <div className="from-primary-50 flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b to-white px-6 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-8 flex flex-col items-center">
        <MdAccountCircle className="text-primary-600 mb-4 text-7xl" />
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Family Drive Gallery
        </h1>
        <p className="text-center text-base text-gray-500 dark:text-gray-400">
          一個可自架、以家庭或小團隊為中心的私有媒體相簿平台
        </p>
      </div>

      {/* 應用程式用途說明 */}
      <div className="mb-8 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-4 text-center text-sm font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
          此應用程式可讓您
        </p>
        <ul className="flex flex-col gap-3">
          <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <MdPhotoLibrary className="text-primary-500 mt-0.5 shrink-0 text-lg" />
            瀏覽與查看 Google Drive 的照片與影片
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <MdCloudQueue className="text-primary-500 mt-0.5 shrink-0 text-lg" />
            上傳新照片至您自有的私人雲端資料夾
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <MdLock className="text-primary-500 mt-0.5 shrink-0 text-lg" />
            僅限受邀的家庭成員存取，非公開服務
          </li>
        </ul>
      </div>

      {error && (
        <div className="bg-danger-500/10 text-danger-500 mb-6 w-full max-w-sm rounded-xl px-4 py-3 text-center">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="touch-target flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-xl font-medium text-gray-800 shadow-md transition-shadow hover:shadow-lg disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        <FcGoogle className="text-3xl" />
        {loading ? "登入中..." : "使用 Google 帳號登入"}
      </button>

      <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">僅限受邀成員使用</p>

      <footer className="mt-8 flex gap-4 text-xs text-gray-400 dark:text-gray-500">
        <Link to="/privacy" className="hover:text-primary-500 hover:underline">
          隱私權政策
        </Link>
        <span>·</span>
        <Link to="/terms" className="hover:text-primary-500 hover:underline">
          服務條款
        </Link>
      </footer>
    </div>
  );
}
