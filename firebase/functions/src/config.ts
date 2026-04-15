export type RuntimeConfig = {
  sharedFolderId: string;
  serviceAccountEmail: string;
  privateKey: string;
  allowedOrigins: string[];
};

export function loadConfig(): RuntimeConfig {
  const sharedFolderId = process.env.SHARED_DRIVE_FOLDER_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!sharedFolderId) {
    throw new Error("Missing SHARED_DRIVE_FOLDER_ID");
  }
  if (!serviceAccountEmail) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  }
  if (!privateKey) {
    throw new Error("Missing GOOGLE_PRIVATE_KEY");
  }

  return {
    sharedFolderId,
    serviceAccountEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    allowedOrigins,
  };
}
