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
