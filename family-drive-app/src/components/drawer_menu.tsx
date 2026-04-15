import { useState } from "react";

import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import {
  MdClose,
  MdHome,
  MdSettings,
  MdLogout,
  MdLightMode,
  MdDarkMode,
  MdBrightness6,
  MdExpandMore,
  MdChevronRight,
  MdShield,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { CookieSettingsModal } from "./cookie_settings_modal";

import { useAuthStore } from "../stores/auth_store";
import { useThemeStore } from "../stores/theme_store";
import { useDriveStore } from "../stores/drive_store";

type DrawerMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function DrawerMenu({ open, onClose }: DrawerMenuProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [legalGroupOpen, setLegalGroupOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const userInfo = useAuthStore((s) => s.userInfo);
  const logout = useAuthStore((s) => s.logout);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const navigateToRoot = useDriveStore((s) => s.navigateToRoot);
  const navigate = useNavigate();

  if (!user || !userInfo) {
    return null;
  }

  function handleLogout() {
    logout();
    onClose();
  }

  function handleAvatarError() {
    setAvatarError(true);
  }

  function handleNavigateLegal(path: string) {
    onClose();
    navigate(path);
  }

  function handleOpenCookieSettings() {
    onClose();
    setCookieSettingsOpen(true);
  }

  function handleCloseCookieSettings() {
    setCookieSettingsOpen(false);
  }

  // 取得問候語
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "你好";
    } else if (hour < 18) {
      return "午安";
    }
    return "晚安";
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        direction="left"
        className="!w-80 !bg-white dark:!bg-[#242526]"
        overlayOpacity={0.4}
        enableOverlay={true}
      >
        <div className="flex h-full flex-col">
          {/* 用戶資訊區 */}
          <div className="from-primary-50 to-primary-100 border-b border-gray-200 bg-gradient-to-br p-6 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-lg p-2 text-2xl text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-700/50"
              aria-label="關閉選單"
            >
              <MdClose />
            </button>

            <div className="flex items-center gap-4 pt-2">
              {userInfo.photoURL && !avatarError ? (
                <img
                  src={userInfo.photoURL}
                  alt={userInfo.displayName}
                  className="h-16 w-16 rounded-full border-4 border-white shadow-lg dark:border-gray-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={handleAvatarError}
                />
              ) : (
                <span className="bg-primary-500 inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-2xl font-semibold text-white shadow-lg dark:border-gray-700">
                  {userInfo.displayName?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  {getGreeting()}，
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {userInfo.displayName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{userInfo.email}</p>
              </div>
            </div>

            {/* 角色標籤 */}
            <div className="mt-3">
              <span className="bg-primary-600 inline-block rounded-full px-3 py-1 text-sm font-medium text-white">
                {userInfo.role === "admin" ? "管理員" : "家庭成員"}
              </span>
            </div>
          </div>

          {/* 選單項目 */}
          <nav
            className="flex-1 touch-pan-y overflow-y-auto overscroll-contain p-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              type="button"
              onClick={() => {
                navigateToRoot();
                onClose();
              }}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            >
              <MdHome className="text-primary-500 text-2xl" />
              首頁
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            >
              {themeMode === "light" ? (
                <>
                  <MdLightMode className="text-2xl" />
                  淺色模式
                </>
              ) : themeMode === "dark" ? (
                <>
                  <MdDarkMode className="text-2xl" />
                  深色模式
                </>
              ) : (
                <>
                  <MdBrightness6 className="text-2xl" />
                  跟隨系統
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                navigate("/preferences");
                onClose();
              }}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            >
              <MdSettings className="text-2xl" />
              偏好設定
            </button>

            {/* 法律與隱私 */}
            <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setLegalGroupOpen(!legalGroupOpen)}
                className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
              >
                <MdShield className="text-2xl" />
                <span className="flex-1 text-left">法律與隱私</span>
                {legalGroupOpen ? (
                  <MdExpandMore className="text-2xl text-gray-400" />
                ) : (
                  <MdChevronRight className="text-2xl text-gray-400" />
                )}
              </button>
              {legalGroupOpen && (
                <div className="mt-0.5 ml-10 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleNavigateLegal("/terms")}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
                  >
                    服務條款
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateLegal("/privacy")}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
                  >
                    隱私政策
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateLegal("/cookie-policy")}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
                  >
                    Cookie 政策
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCookieSettings}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
                  >
                    Cookie 設定
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* 底部登出按鈕 */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <button
              type="button"
              onClick={handleLogout}
              className="bg-danger-600 hover:bg-danger-700 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-white"
            >
              <MdLogout className="text-2xl" />
              登出
            </button>
          </div>
        </div>
      </Drawer>
      <CookieSettingsModal open={cookieSettingsOpen} onClose={handleCloseCookieSettings} />
    </>
  );
}
