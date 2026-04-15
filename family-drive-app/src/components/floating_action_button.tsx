import { useState } from "react";
import { MdAdd, MdPhotoAlbum, MdCreateNewFolder, MdFileUpload } from "react-icons/md";

interface FloatingActionButtonProps {
  isRoot: boolean;
  canUpload: boolean;
  onCreateAlbum: () => void;
  onCreateFolder: () => void;
  onUpload: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-3.5 text-base text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:active:bg-gray-700"
    >
      <span className="text-xl text-gray-500 dark:text-gray-400">{icon}</span>
      {label}
    </button>
  );
}

export function FloatingActionButton({
  isRoot,
  canUpload,
  onCreateAlbum,
  onCreateFolder,
  onUpload,
}: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);

  function handleClose() {
    setOpen(false);
  }

  function handleCreateAlbum() {
    handleClose();
    onCreateAlbum();
  }

  function handleCreateFolder() {
    handleClose();
    onCreateFolder();
  }

  function handleUpload() {
    handleClose();
    onUpload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="新增"
        className="bg-primary-600 hover:bg-primary-700 fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95"
      >
        <MdAdd
          className={`text-3xl transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={handleClose}
        >
          <div
            role="menu"
            className="w-full max-w-lg rounded-t-2xl bg-white dark:bg-[#242526]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto my-2 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            <p className="px-4 pt-1 pb-1 text-base font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
              新增
            </p>

            {isRoot && (
              <MenuItem icon={<MdPhotoAlbum />} label="建立相簿" onClick={handleCreateAlbum} />
            )}

            {!isRoot && (
              <>
                {canUpload && (
                  <MenuItem icon={<MdFileUpload />} label="上傳" onClick={handleUpload} />
                )}
                <MenuItem
                  icon={<MdCreateNewFolder />}
                  label="建立資料夾"
                  onClick={handleCreateFolder}
                />
              </>
            )}

            <div className="h-4" />
          </div>
        </div>
      )}
    </>
  );
}
