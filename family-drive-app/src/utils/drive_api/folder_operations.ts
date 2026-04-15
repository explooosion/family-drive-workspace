import type { DriveFile } from "../../types";
import { TRASH_FOLDER_NAME } from "../../config/drive";
import { callDriveApi } from "../../services/functions_api";

export async function findOrCreateFolder(accessToken: string, name: string, parentId?: string) {
  void accessToken;
  return callDriveApi<DriveFile>("/drive/folder/find-or-create", {
    body: { name, parentId },
  });
}

export async function createFolder(accessToken: string, name: string, parentId?: string) {
  void accessToken;
  return callDriveApi<DriveFile>("/drive/folder/create", {
    body: { name, parentId },
  });
}

export async function ensureRootFolder(accessToken: string) {
  void accessToken;
  return callDriveApi<DriveFile>("/drive/folder/ensure-root");
}

export async function ensureTrashFolder(accessToken: string) {
  return findOrCreateFolder(accessToken, TRASH_FOLDER_NAME);
}
