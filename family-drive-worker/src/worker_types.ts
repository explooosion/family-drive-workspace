export interface Env {
  FIREBASE_PROJECT_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  ALLOWED_ORIGINS: string;
}

export interface TokenCache {
  token: string;
  expiresAt: number;
}
