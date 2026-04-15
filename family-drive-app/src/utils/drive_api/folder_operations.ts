import type { DriveFile } from "../../types";
import { DRIVE_API_BASE, TRASH_FOLDER_NAME } from "../../config/drive";

import { authHeaders } from "./api_helpers";

export async function findOrCreateFolder(accessToken: string, name: string, parentId?: string) {
  const parentClause = parentId ? `and '${parentId}' in parents` : "";
  const q = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' ${parentClause} and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: "files(id,name)",
  });

  const res = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(`Drive API error: ${res.status}`);
  }
  const data = (await res.json()) as { files: DriveFile[] };
  if (data.files.length > 0) {
    return data.files[0];
  }

  return createFolder(accessToken, name, parentId);
}

export async function createFolder(accessToken: string, name: string, parentId?: string) {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch(`${DRIVE_API_BASE}/files`, {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) {
    throw new Error(`Drive API create folder error: ${res.status}`);
  }
  return res.json() as Promise<DriveFile>;
}

export async function ensureRootFolder(accessToken: string) {
  const rootFolderId = import.meta.env.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!rootFolderId) {
    throw new Error("VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured");
  }

  const res = await fetch(`${DRIVE_API_BASE}/files/${rootFolderId}?fields=id,name`, {
    headers: authHeaders(accessToken),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `❌ Google Drive 資料夾不存在或無法訪問\n\n請檢查：\n1. 資料夾 ID 是否正確：${rootFolderId}\n2. 確認您的 Google 帳號有權限訪問此資料夾\n3. 資料夾是否已被刪除\n\n如何取得正確的資料夾 ID：\n1. 前往 Google Drive 開啟要使用的資料夾\n2. 從網址列複製資料夾 ID\n   範例：https://drive.google.com/drive/folders/{資料夾ID}\n3. 將資料夾 ID 更新到 .env 檔案中的 VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID`,
      );
    }
    if (res.status === 403) {
      throw new Error(
        `❌ 權限不足\n\n您的 Google 帳號沒有權限訪問此資料夾。\n\n請確認：\n1. 該資料夾已分享給您的 Google 帳號\n2. 您的帳號有「編輯者」或「擁有者」權限`,
      );
    }
    throw new Error(
      `❌ 無法訪問 Google Drive 資料夾 (${res.status})\n\n請確認：\n1. 網路連線正常\n2. Google Drive API 配額未超過\n3. 資料夾 ID 正確：${rootFolderId}`,
    );
  }

  return res.json() as Promise<DriveFile>;
}

export async function ensureTrashFolder(accessToken: string) {
  return findOrCreateFolder(accessToken, TRASH_FOLDER_NAME);
}
