import { useState } from "react";
import { MdMenu, MdArrowBack } from "react-icons/md";

import { useAuthStore } from "../stores/auth_store";
import { useDriveStore } from "../stores/drive_store";
import { DrawerMenu } from "./drawer_menu";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const user = useAuthStore((s) => s.user);
  const userInfo = useAuthStore((s) => s.userInfo);
  const folderStack = useDriveStore((s) => s.folderStack);
  const navigateBack = useDriveStore((s) => s.navigateBack);

  function handleAvatarError() {
    setAvatarError(true);
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#242526]">
        <div className="flex items-center justify-between px-4 py-2.5">
          {folderStack.length > 1 ? (
            <button
              type="button"
              onClick={navigateBack}
              className="btn-icon text-2xl"
              aria-label="返回上一層"
            >
              <MdArrowBack />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="btn-icon text-2xl"
              aria-label="選單"
            >
              <MdMenu />
            </button>
          )}

          <h1 className="flex-1 text-center text-[17px] font-bold text-gray-900 dark:text-white">
            {folderStack[folderStack.length - 1]?.name || "Family Drive Gallery"}
          </h1>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full transition-transform hover:scale-105"
            aria-label="使用者選單"
          >
            {userInfo?.photoURL && !avatarError ? (
              <img
                src={userInfo.photoURL}
                alt={userInfo.displayName}
                className="hover:border-primary-500 h-9 w-9 rounded-full border-2 border-transparent"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={handleAvatarError}
              />
            ) : (
              userInfo && (
                <span className="bg-primary-500 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white">
                  {userInfo.displayName?.[0]?.toUpperCase() ?? "?"}
                </span>
              )
            )}
          </button>
        </div>
      </header>

      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
