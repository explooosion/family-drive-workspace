import type { Response } from "express";
import { onRequest, Request } from "firebase-functions/v2/https";

import { loadConfig } from "./config";
import { requireAllowedUser, requireRole } from "./auth";
import {
  createDriveClient,
  ensureInSharedScope,
  initiateResumableUpload,
  uploadResumableChunk,
} from "./drive";

function resolveCorsOrigin(requestOrigin: string | undefined, allowedOrigins: string[]): string {
  if (allowedOrigins.length === 0) {
    return "*";
  }

  if (!requestOrigin) {
    return allowedOrigins[0];
  }

  if (allowedOrigins.includes("*") || allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return "";
}

function withCors(response: Response, origin: string): void {
  if (origin) {
    response.set("Access-Control-Allow-Origin", origin);
    response.set("Vary", "Origin");
  }
  response.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function sendError(response: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "unknown_error";

  if (message === "unauthorized") {
    response.status(401).json({ error: "unauthorized" });
    return;
  }
  if (
    message === "forbidden" ||
    message === "forbidden_scope" ||
    message === "forbidden_role" ||
    message === "forbidden_email"
  ) {
    response.status(403).json({ error: "forbidden" });
    return;
  }

  response.status(500).json({ error: message });
}

export const driveApi = onRequest(async (request: Request, response: Response) => {
  const config = loadConfig();
  const corsOrigin = resolveCorsOrigin(request.headers.origin, config.allowedOrigins);

  if (request.headers.origin && !corsOrigin) {
    response.status(403).json({ error: "forbidden_origin" });
    return;
  }

  withCors(response, corsOrigin);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const authUser = await requireAllowedUser(request);
    const drive = createDriveClient(config);

    if (request.method === "POST" && request.path.endsWith("/drive/list")) {
      const { folderId } = request.body as { folderId: string };
      await ensureInSharedScope(drive, folderId, config.sharedFolderId);

      const list = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields:
          "files(id,name,mimeType,parents,size,createdTime,modifiedTime,thumbnailLink,webContentLink,webViewLink,appProperties)",
        orderBy: "folder,name",
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      response.json({ files: list.data.files ?? [] });
      return;
    }

    if (request.method === "POST" && request.path.endsWith("/drive/folder/create")) {
      const { name, parentId } = request.body as { name: string; parentId?: string };
      const targetParent = parentId ?? config.sharedFolderId;
      await ensureInSharedScope(drive, targetParent, config.sharedFolderId);

      const created = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [targetParent],
        },
        fields: "id,name,mimeType,parents",
        supportsAllDrives: true,
      });

      response.json(created.data);
      return;
    }

    if (request.method === "POST" && request.path.endsWith("/drive/folder/find-or-create")) {
      const { name, parentId } = request.body as { name: string; parentId?: string };
      const targetParent = parentId ?? config.sharedFolderId;
      await ensureInSharedScope(drive, targetParent, config.sharedFolderId);

      const escapedName = name.replace(/'/g, "\\'");
      const existing = await drive.files.list({
        q: `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and '${targetParent}' in parents and trashed = false`,
        fields: "files(id,name,mimeType,parents)",
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const match = existing.data.files?.[0];
      if (match) {
        response.json(match);
        return;
      }

      const created = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [targetParent],
        },
        fields: "id,name,mimeType,parents",
        supportsAllDrives: true,
      });

      response.json(created.data);
      return;
    }

    if (request.method === "POST" && request.path.endsWith("/drive/file/rename")) {
      const { fileId, newName } = request.body as { fileId: string; newName: string };
      await ensureInSharedScope(drive, fileId, config.sharedFolderId);

      const renamed = await drive.files.update({
        fileId,
        requestBody: { name: newName },
        fields: "id,name,mimeType,parents",
        supportsAllDrives: true,
      });

      response.json(renamed.data);
      return;
    }

    if (request.method === "POST" && request.path.endsWith("/drive/file/delete")) {
      requireRole(authUser, ["admin"]);

      const { fileId } = request.body as { fileId: string };
      await ensureInSharedScope(drive, fileId, config.sharedFolderId);

      await drive.files.delete({
        fileId,
        supportsAllDrives: true,
      });

      response.json({ ok: true });
      return;
    }

    if (request.method === "POST" && request.path.endsWith("/drive/file/soft-delete")) {
      requireRole(authUser, ["admin"]);

      const { fileId, trashFolderId, originalParentId } = request.body as {
        fileId: string;
        trashFolderId: string;
        originalParentId: string;
      };
      await ensureInSharedScope(drive, fileId, config.sharedFolderId);
      await ensureInSharedScope(drive, trashFolderId, config.sharedFolderId);
      await ensureInSharedScope(drive, originalParentId, config.sharedFolderId);

      const moved = await drive.files.update({
        fileId,
        addParents: trashFolderId,
        removeParents: originalParentId,
        requestBody: {
          appProperties: {
            original_parent_id: originalParentId,
          },
        },
        fields: "id,name,mimeType,parents",
        supportsAllDrives: true,
      });

      response.json(moved.data);
      return;
    }

    if (request.method === "POST" && request.path.endsWith("/drive/upload/initiate")) {
      const { fileName, mimeType, parentId } = request.body as {
        fileName: string;
        mimeType: string;
        parentId: string;
      };
      await ensureInSharedScope(drive, parentId, config.sharedFolderId);
      const uploadUrl = await initiateResumableUpload(config, fileName, mimeType, parentId);
      response.json({ uploadUrl });
      return;
    }

    if (request.method === "POST" && request.path.endsWith("/drive/upload/chunk")) {
      const { uploadUrl, chunkBase64, startByte, totalBytes } = request.body as {
        uploadUrl: string;
        chunkBase64: string;
        startByte: number;
        totalBytes: number;
      };

      const chunkBytes = Buffer.from(chunkBase64, "base64");
      const upstream = await uploadResumableChunk(uploadUrl, chunkBytes, startByte, totalBytes);

      if (upstream.status === 200 || upstream.status === 201) {
        const file = (await upstream.json()) as unknown;
        response.json({ done: true, file });
        return;
      }

      if (upstream.status === 308) {
        response.json({ done: false });
        return;
      }

      const upstreamText = await upstream.text();
      throw new Error(`upload_chunk_failed_${upstream.status}:${upstreamText.slice(0, 200)}`);
    }

    if (request.method === "POST" && request.path.endsWith("/drive/folder/ensure-root")) {
      const root = await drive.files.get({
        fileId: config.sharedFolderId,
        fields: "id,name,mimeType,parents",
        supportsAllDrives: true,
      });

      response.json(root.data);
      return;
    }

    response.status(404).json({ error: "not_found" });
  } catch (error) {
    sendError(response, error);
  }
});
