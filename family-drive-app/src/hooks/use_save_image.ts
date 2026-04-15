import { useState, useCallback } from "react";

import { DRIVE_API_BASE } from "../config/drive";
import type { DriveFile } from "../types";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

function isMobileOrPwa(): boolean {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  const isTouchDevice =
    navigator.maxTouchPoints > 0 && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return isStandalone || isTouchDevice;
}

function resolveFileName(file: DriveFile, blobType: string): string {
  if (file.name.includes(".")) {
    return file.name;
  }
  const mimeType = blobType || file.mimeType;
  const ext = MIME_TO_EXT[mimeType] ?? "jpg";
  return `${file.name}.${ext}`;
}

/**
 * Hybrid save hook — Web Share API on mobile/PWA, anchor download on desktop.
 *
 * On iOS/Android (PWA or browser), navigator.share triggers the native share
 * sheet where the user can choose "Save Image" to save to the photo library.
 * On desktop the browser initiates a file download.
 */
export function useSaveImage(accessToken: string) {
  const [saving, setSaving] = useState(false);

  const saveImage = useCallback(
    async (file: DriveFile) => {
      if (!accessToken || saving) {
        return;
      }
      setSaving(true);
      try {
        const res = await fetch(`${DRIVE_API_BASE}/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          return;
        }
        const blob = await res.blob();
        const mimeType = blob.type || file.mimeType || "image/jpeg";
        const fileName = resolveFileName(file, mimeType);
        const shareFile = new File([blob], fileName, { type: mimeType });

        // Primary: Web Share API (mobile / PWA only) — triggers native "Save Image"
        if (
          isMobileOrPwa() &&
          typeof navigator.share === "function" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [shareFile] })
        ) {
          await navigator.share({ files: [shareFile] });
          return;
        }

        // Fallback: browser anchor download (desktop / legacy)
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // User dismissed share sheet — treat as silent cancel
      } finally {
        setSaving(false);
      }
    },
    [accessToken, saving],
  );

  return { saving, saveImage };
}
