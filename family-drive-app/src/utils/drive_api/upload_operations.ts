import type { DriveFile } from "../../types";
import { DRIVE_UPLOAD_BASE } from "../../config/drive";

import { authHeaders } from "./api_helpers";

export async function initiateResumableUpload(
  accessToken: string,
  fileName: string,
  mimeType: string,
  parentId: string,
) {
  const metadata = {
    name: fileName,
    parents: [parentId],
  };
  const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=resumable`, {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mimeType,
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) {
    throw new Error(`Drive API resumable init error: ${res.status}`);
  }
  const uploadUrl = res.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("No upload URL returned");
  }
  return uploadUrl;
}

export async function uploadChunk(
  uploadUrl: string,
  chunk: Blob,
  startByte: number,
  totalBytes: number,
) {
  const endByte = startByte + chunk.size - 1;
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes ${startByte}-${endByte}/${totalBytes}`,
    },
    body: chunk,
  });

  if (res.status === 200 || res.status === 201) {
    return res.json() as Promise<DriveFile>;
  }
  if (res.status === 308) {
    return null;
  }
  throw new Error(`Upload chunk failed: ${res.status}`);
}

export async function uploadFile(
  accessToken: string,
  file: File,
  parentId: string,
  onProgress?: (progress: number) => void,
) {
  const uploadUrl = await initiateResumableUpload(accessToken, file.name, file.type, parentId);

  const chunkSize = 256 * 1024;
  let startByte = 0;

  while (startByte < file.size) {
    const chunk = file.slice(startByte, startByte + chunkSize);
    const result = await uploadChunk(uploadUrl, chunk, startByte, file.size);
    startByte += chunk.size;

    if (onProgress) {
      onProgress(Math.min((startByte / file.size) * 100, 100));
    }

    if (result) {
      return result;
    }
  }

  throw new Error("Upload finished without response");
}
