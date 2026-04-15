import { google, drive_v3 } from "googleapis";

import type { RuntimeConfig } from "./config";

export function createDriveClient(config: RuntimeConfig): drive_v3.Drive {
  const auth = new google.auth.JWT({
    email: config.serviceAccountEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

export async function initiateResumableUpload(
  config: RuntimeConfig,
  fileName: string,
  mimeType: string,
  parentId: string,
): Promise<string> {
  const auth = new google.auth.JWT({
    email: config.serviceAccountEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const { token: accessToken } = await auth.getAccessToken();

  if (!accessToken) {
    throw new Error("failed_to_get_access_token");
  }

  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
      },
      body: JSON.stringify({ name: fileName, parents: [parentId] }),
    },
  );

  if (!initRes.ok) {
    throw new Error(`upload_init_failed_${initRes.status}`);
  }

  const uploadUrl = initRes.headers.get("location");

  if (!uploadUrl) {
    throw new Error("missing_upload_url");
  }

  return uploadUrl;
}

export async function ensureInSharedScope(
  drive: drive_v3.Drive,
  fileId: string,
  sharedFolderId: string,
): Promise<void> {
  if (fileId === sharedFolderId) {
    return;
  }

  let currentId: string | undefined = fileId;
  let depth = 0;

  while (currentId && depth < 20) {
    const fileResponse = await drive.files.get({
      fileId: currentId,
      fields: "id,parents",
      supportsAllDrives: true,
    });

    const parents: string[] = fileResponse.data.parents ?? [];

    if (parents.includes(sharedFolderId)) {
      return;
    }

    currentId = parents[0];
    depth += 1;
  }

  throw new Error("forbidden_scope");
}
