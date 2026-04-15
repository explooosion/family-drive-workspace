export interface Env {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  ALLOWED_ORIGIN: string;
}

export interface TokenCache {
  token: string;
  expiresAt: number;
}
