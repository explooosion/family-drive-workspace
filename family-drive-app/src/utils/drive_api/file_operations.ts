import type { DriveFile } from "../../types";
import { callDriveApi } from "../../services/functions_api";

export async function listFiles(accessToken: string, folderId: string) {
  void accessToken;
  return callDriveApi<{ files: DriveFile[] }>("/drive/list", {
    body: { folderId },
  });
}

export async function renameFile(accessToken: string, fileId: string, newName: string) {
  void accessToken;
  return callDriveApi<DriveFile>("/drive/file/rename", {
    body: { fileId, newName },
  });
}

export async function softDeleteFile(
  accessToken: string,
  fileId: string,
  trashFolderId: string,
  originalParentId: string,
) {
  void accessToken;
  return callDriveApi<DriveFile>("/drive/file/soft-delete", {
    body: { fileId, trashFolderId, originalParentId },
  });
}

export async function getChangesStartToken(accessToken: string): Promise<string> {
  void accessToken;
  return "functions-mode";
}

export async function getChangesSince(
  accessToken: string,
  pageToken: string,
): Promise<{ affectedParentIds: Set<string>; newPageToken: string }> {
  void accessToken;
  return {
    affectedParentIds: new Set<string>(),
    newPageToken: pageToken,
  };
}
