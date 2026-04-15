export function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function isVideoMime(mimeType: string) {
  return mimeType.startsWith("video/");
}

export function isFolderMime(mimeType: string) {
  return mimeType === "application/vnd.google-apps.folder";
}
