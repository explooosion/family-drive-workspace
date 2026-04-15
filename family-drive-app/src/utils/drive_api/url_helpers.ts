import type { DriveFile } from "../../types";

/**
 * 透過 Cloudflare Worker 代理串流影片
 * 支援 HTTP Range Request，讓瀏覽器原生 seek 且無需下載整檔
 */
export function getWorkerVideoUrl(fileId: string, idToken?: string): string {
  const base = import.meta.env.VITE_CLOUDFLARE_WORKER_URL as string;
  const url = new URL(`${base}/file/${fileId}`);

  if (idToken) {
    url.searchParams.set("token", idToken);
  }

  return url.toString();
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

  return getWorkerVideoUrl(file.id, accessToken);
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

  return getWorkerVideoUrl(file.id, accessToken);
}
