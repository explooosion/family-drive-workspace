import { useState, useCallback } from "react";

import { getWorkerVideoUrl, isVideoMime } from "../services/google_drive";
import type { DriveFile } from "../types";
import { useAuthStore } from "../stores/auth_store";

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
export function useSaveImage() {
  const [saving, setSaving] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const saveImage = useCallback(
    async (file: DriveFile) => {
      if (saving) {
        return;
      }
      setSaving(true);
      try {
        const workerUrl = getWorkerVideoUrl(file.id, accessToken ?? undefined);

        // Desktop video: use direct anchor download to avoid buffering entire file in memory
        if (isVideoMime(file.mimeType) && !isMobileOrPwa()) {
          const fileName = resolveFileName(file, file.mimeType);
          const a = document.createElement("a");
          a.href = workerUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }

        // Mobile / PWA (image or video): fetch blob for Web Share API
        const res = await fetch(workerUrl);
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

        // Fallback: browser anchor download (desktop image / legacy)
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
