import type { DriveFile } from "../../types";
import { callDriveApi } from "../../services/functions_api";

export async function initiateResumableUpload(
  accessToken: string,
  fileName: string,
  mimeType: string,
  parentId: string,
) {
  void accessToken;
  const result = await callDriveApi<{ uploadUrl: string }>("/drive/upload/initiate", {
    body: { fileName, mimeType, parentId },
  });
  return result.uploadUrl;
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
  onProgress?: (uploadedBytes: number, totalBytes: number) => void,
) {
  const uploadUrl = await initiateResumableUpload(accessToken, file.name, file.type, parentId);

  const chunkSize = 256 * 1024;
  let startByte = 0;

  while (startByte < file.size) {
    const chunk = file.slice(startByte, startByte + chunkSize);
    const result = await uploadChunk(uploadUrl, chunk, startByte, file.size);
    startByte += chunk.size;

    if (onProgress) {
      onProgress(Math.min(startByte, file.size), file.size);
    }

    if (result) {
      return result;
    }
  }

  throw new Error("Upload finished without response");
}
