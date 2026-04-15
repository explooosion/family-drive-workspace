import type { DriveFile } from "../../types";
import { callDriveApi } from "../../services/functions_api";

type UploadChunkResponse =
  | {
      done: false;
    }
  | {
      done: true;
      file: DriveFile;
    };

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
  const chunkBase64 = await blobToBase64(chunk);

  const res = await callDriveApi<UploadChunkResponse>("/drive/upload/chunk", {
    body: {
      uploadUrl,
      chunkBase64,
      startByte,
      totalBytes,
    },
  });

  if (!res.done) {
    return null;
  }

  return res.file;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("blob_to_base64_failed"));
    };

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("blob_to_base64_failed"));
        return;
      }

      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };

    reader.readAsDataURL(blob);
  });
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
