type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type JwtPayload = {
  aud?: string;
  auth_time?: number;
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  user_id?: string;
};

type JwkResponse = {
  keys?: Array<JsonWebKey & { kid?: string }>;
};

type PublicKeyCache = {
  expiresAt: number;
  keys: Map<string, JsonWebKey>;
};

const FIREBASE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let publicKeyCache: PublicKeyCache | null = null;

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function parseMaxAgeSeconds(cacheControl: string | null): number {
  const match = cacheControl?.match(/max-age=(\d+)/i);

  if (!match) {
    return 3600;
  }

  return Number.parseInt(match[1], 10);
}

function parseToken(token: string): {
  header: JwtHeader;
  payload: JwtPayload;
  signedContent: string;
  signature: Uint8Array;
} {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("invalid_token");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedHeader))) as JwtHeader;
  const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as JwtPayload;

  return {
    header,
    payload,
    signedContent: `${encodedHeader}.${encodedPayload}`,
    signature: decodeBase64Url(encodedSignature),
  };
}

async function loadPublicKeys(): Promise<Map<string, JsonWebKey>> {
  const now = Date.now();

  if (publicKeyCache && publicKeyCache.expiresAt > now) {
    return publicKeyCache.keys;
  }

  const response = await fetch(FIREBASE_JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });

  if (!response.ok) {
    throw new Error("jwks_unavailable");
  }

  const body = (await response.json()) as JwkResponse;
  const keys = new Map<string, JsonWebKey>();

  for (const jwk of body.keys ?? []) {
    if (typeof jwk.kid === "string") {
      keys.set(jwk.kid, jwk);
    }
  }

  publicKeyCache = {
    expiresAt: now + parseMaxAgeSeconds(response.headers.get("Cache-Control")) * 1000,
    keys,
  };

  return keys;
}

function validatePayload(payload: JwtPayload, projectId: string): void {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload.aud !== projectId || payload.iss !== expectedIssuer) {
    throw new Error("invalid_token");
  }

  if (!payload.sub || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new Error("invalid_token");
  }

  if (!payload.exp || payload.exp <= nowSeconds) {
    throw new Error("expired_token");
  }

  if (!payload.iat || payload.iat > nowSeconds + 300) {
    throw new Error("invalid_token");
  }
}

export async function verifyFirebaseIdToken(token: string, projectId: string): Promise<JwtPayload> {
  const { header, payload, signedContent, signature } = parseToken(token);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("invalid_token");
  }

  validatePayload(payload, projectId);

  const publicKeys = await loadPublicKeys();
  const jwk = publicKeys.get(header.kid);

  if (!jwk) {
    throw new Error("unknown_key_id");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature,
    new TextEncoder().encode(signedContent),
  );

  if (!verified) {
    throw new Error("invalid_token");
  }

  return payload;
}