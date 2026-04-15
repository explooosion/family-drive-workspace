import type { DriveFile } from "../../types";
import { DRIVE_API_BASE } from "../../config/drive";

import { authHeaders } from "./api_helpers";

export async function listFiles(accessToken: string, folderId: string) {
  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const q = `'${folderId}' in parents and trashed = false`;
    const params = new URLSearchParams({
      q,
      fields:
        "nextPageToken,files(id,name,mimeType,parents,size,createdTime,modifiedTime,thumbnailLink,webContentLink,webViewLink,appProperties)",
      orderBy: "folder,name",
      pageSize: "1000",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
      headers: authHeaders(accessToken),
    });
    if (!response.ok) {
      throw new Error(`Drive API error: ${response.status}`);
    }
    const result = (await response.json()) as {
      files: DriveFile[];
      nextPageToken?: string;
    };

    allFiles.push(...result.files);
    pageToken = result.nextPageToken;
  } while (pageToken);

  return { files: allFiles };
}

export async function renameFile(accessToken: string, fileId: string, newName: string) {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    throw new Error(`Drive API rename error: ${res.status}`);
  }
  return res.json() as Promise<DriveFile>;
}

export async function softDeleteFile(
  accessToken: string,
  fileId: string,
  trashFolderId: string,
  originalParentId: string,
) {
  // addParents / removeParents must be query parameters, not body fields
  const params = new URLSearchParams({
    addParents: trashFolderId,
    removeParents: originalParentId,
    fields: "id",
  });
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      appProperties: { original_parent_id: originalParentId },
    }),
  });
  if (!res.ok) {
    throw new Error(`Drive API soft delete error: ${res.status}`);
  }
  return res.json() as Promise<DriveFile>;
}

export async function getChangesStartToken(accessToken: string): Promise<string> {
  const res = await fetch(`${DRIVE_API_BASE}/changes/startPageToken`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    throw new Error(`Drive API changes startPageToken error: ${res.status}`);
  }
  const data = (await res.json()) as { startPageToken: string };
  return data.startPageToken;
}

export async function getChangesSince(
  accessToken: string,
  pageToken: string,
): Promise<{ affectedParentIds: Set<string>; newPageToken: string }> {
  const affectedParentIds = new Set<string>();
  let token = pageToken;
  let pageCount = 0;
  const MAX_PAGES = 5;
  let hasNextPage = true;

  while (hasNextPage) {
    const params = new URLSearchParams({
      pageToken: token,
      includeRemoved: "true",
      fields: "newStartPageToken,nextPageToken,changes(fileId,removed,file(id,trashed,parents))",
      pageSize: "1000",
    });
    const res = await fetch(`${DRIVE_API_BASE}/changes?${params}`, {
      headers: authHeaders(accessToken),
    });
    if (!res.ok) {
      throw new Error(`Drive API changes list error: ${res.status}`);
    }
    const data = (await res.json()) as {
      newStartPageToken?: string;
      nextPageToken?: string;
      changes: Array<{
        fileId: string;
        removed: boolean;
        file?: { id: string; trashed: boolean; parents?: string[] } | null;
      }>;
    };

    for (const change of data.changes) {
      if (change.file?.parents) {
        for (const parentId of change.file.parents) {
          affectedParentIds.add(parentId);
        }
      }
    }

    if (data.newStartPageToken) {
      return { affectedParentIds, newPageToken: data.newStartPageToken };
    }
    if (!data.nextPageToken) {
      hasNextPage = false;
      continue;
    }
    token = data.nextPageToken;
    pageCount += 1;
    if (pageCount >= MAX_PAGES) {
      // 超過頁數上限：取最新 startPageToken 重置，避免下次重複掃描
      hasNextPage = false;
    }
  }

  return { affectedParentIds, newPageToken: token };
}
