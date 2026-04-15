import type { DriveFile } from "../../types";
import { DRIVE_API_BASE } from "../../config/drive";

/**
 * 透過 Cloudflare Worker 代理串流影片
 * 支援 HTTP Range Request，讓瀏覽器原生 seek 且無需下載整檔
 */
export function getWorkerVideoUrl(fileId: string): string {
  const base = import.meta.env.VITE_CLOUDFLARE_WORKER_URL as string;
  return `${base}/file/${fileId}`;
}

/**
 * 取得縮圖 URL (用於列表顯示)
 * 優先使用 Google 提供的 thumbnailLink，避免 CORS 問題
 * 參考: https://developers.google.com/drive/api/guides/manage-downloads
 */
export function getThumbnailUrl(file: DriveFile, accessToken: string): string {
  if (file.thumbnailLink) {
    return file.thumbnailLink;
  }

  // webContentLink is a download redirect (drive.google.com/uc?...) — blocked by ORB when used as image src
  // Fall back directly to the Drive API media endpoint with auth token
  return `${DRIVE_API_BASE}/files/${file.id}?alt=media&access_token=${accessToken}`;
}

/**
 * 取得完整圖片 URL (用於 Lightbox 顯示)
 * 優先使用 Google 提供的 URL，避免 CORS/ORB 問題
 * 參考: https://developers.google.com/drive/api/guides/manage-downloads
 */
export function getFileContentUrl(file: DriveFile, accessToken: string): string {
  // 優先使用 webViewLink (在瀏覽器中查看)
  if (file.webViewLink) {
    return file.webViewLink;
  }

  // 次要選項：webContentLink (下載連結)
  if (file.webContentLink) {
    return file.webContentLink;
  }

  // 最後才使用 alt=media，但這可能導致 ORB 錯誤
  // 建議確保檔案有正確的 webViewLink 或 webContentLink
  console.warn(`檔案 ${file.name} 缺少 webViewLink 和 webContentLink，使用 alt=media 可能失敗`);
  return `${DRIVE_API_BASE}/files/${file.id}?alt=media&access_token=${accessToken}`;
}
