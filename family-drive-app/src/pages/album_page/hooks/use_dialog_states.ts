import { useState } from "react";

export function useDialogStates() {
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  return {
    showCreateAlbum,
    setShowCreateAlbum,
    showCreateFolder,
    setShowCreateFolder,
    showUpload,
    setShowUpload,
    showSortMenu,
    setShowSortMenu,
  };
}
