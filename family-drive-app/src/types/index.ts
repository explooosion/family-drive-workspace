export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  appProperties?: Record<string, string>;
};

export type UserRole = "admin" | "member";

export type UserInfo = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  lastLoginAt: number;
  createdAt: number;
};

export type Settings = {
  rootFolderName: string;
  allowUpload: boolean;
  allowDelete: boolean;
};
