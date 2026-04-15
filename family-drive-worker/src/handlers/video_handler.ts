import { buildCorsHeaders } from "../utils/cors_utils";
import { verifyFirebaseIdToken } from "../services/firebase_auth";
import { getAccessToken, invalidateTokenCache } from "../services/token_service";
import type { Env } from "../worker_types";

type DriveFileMetadata = {
  mimeType?: string;
  thumbnailLink?: string;
};

const DEFAULT_VIDEO_THUMBNAIL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="Default video thumbnail">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <circle cx="320" cy="180" r="54" fill="#ffffff" fill-opacity="0.16"/>
  <polygon points="305,150 305,210 355,180" fill="#ffffff"/>
  <text x="320" y="300" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#d1d5db">Preview unavailable</text>
</svg>
`.trim();

function getTraceId(request: Request): string {
  const cfRay = request.headers.get("cf-ray");

  if (!cfRay) {
    return crypto.randomUUID();
  }

  return cfRay.split("-")[0] ?? cfRay;
}

function withTraceHeaders(baseHeaders: HeadersInit, traceId: string): Headers {
  const headers = new Headers(baseHeaders);
  headers.set("X-Worker-Trace-Id", traceId);
  return headers;
}

function buildDefaultThumbnailResponse(
  cors: Record<string, string>,
  traceId: string,
): Response {
  return new Response(DEFAULT_VIDEO_THUMBNAIL_SVG, {
    status: 200,
    headers: withTraceHeaders(
      {
        ...cors,
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, no-store, max-age=0",
      },
      traceId,
    ),
  });
}

function readFirebaseToken(request: Request, url: URL): string | null {
  const bearerToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  const queryToken = url.searchParams.get("token")?.trim();
  return bearerToken || queryToken || null;
}

async function assertAuthorized(
  request: Request,
  url: URL,
  env: Env,
  cors: Record<string, string>,
  traceId: string,
): Promise<Response | null> {
  const firebaseIdToken = readFirebaseToken(request, url);

  if (!firebaseIdToken) {
    console.warn("[worker][auth] missing firebase token", { traceId });
    return new Response("Unauthorized", {
      status: 401,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  try {
    await verifyFirebaseIdToken(firebaseIdToken, env.FIREBASE_PROJECT_ID);
    return null;
  } catch {
    console.warn("[worker][auth] invalid firebase token", { traceId });
    return new Response("Unauthorized", {
      status: 401,
      headers: withTraceHeaders(cors, traceId),
    });
  }
}

async function resolveDriveAccessToken(
  env: Env,
  cors: Record<string, string>,
  traceId: string,
): Promise<{ token: string } | { response: Response }> {
  try {
    const token = await getAccessToken(env);
    return { token };
  } catch {
    console.error("[worker][drive] failed to get service account access token", { traceId });
    return {
      response: new Response("Service unavailable", {
        status: 503,
        headers: withTraceHeaders(cors, traceId),
      }),
    };
  }
}

async function fetchDriveMetadata(fileId: string, accessToken: string): Promise<Response> {
  return fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,mimeType,thumbnailLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

function copyPassThroughHeaders(source: Headers, target: Headers): void {
  const passThroughHeaders = ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"];

  for (const headerName of passThroughHeaders) {
    const value = source.get(headerName);

    if (value) {
      target.set(headerName, value);
    }
  }

  if (!source.get("Accept-Ranges")) {
    target.set("Accept-Ranges", "bytes");
  }
}

export async function handleVideoRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  void ctx;
  const url = new URL(request.url);
  const traceId = getTraceId(request);
  const cors = buildCorsHeaders(env.ALLOWED_ORIGINS, request.headers.get("Origin"));

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  const match = url.pathname.match(/^\/file\/([^/]+)$/);

  if (request.method !== "GET" || !match) {
    return new Response("Not Found", {
      status: 404,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  const fileId = match[1];
  const unauthorizedResponse = await assertAuthorized(request, url, env, cors, traceId);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const rangeHeader = request.headers.get("Range");
  const tokenResult = await resolveDriveAccessToken(env, cors, traceId);

  if ("response" in tokenResult) {
    return tokenResult.response;
  }

  const accessToken = tokenResult.token;

  const driveHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (rangeHeader) {
    driveHeaders["Range"] = rangeHeader;
  }

  const driveResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: driveHeaders },
  );

  if (driveResponse.status === 401 || driveResponse.status === 403) {
    invalidateTokenCache();
    console.warn("[worker][video] drive auth rejected", { traceId, status: driveResponse.status });
    return new Response("Unauthorized", {
      status: 403,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  if (driveResponse.status === 404) {
    return new Response(
      "File not found — ensure the Google Drive folder is shared with the Service Account",
      {
        status: 404,
        headers: withTraceHeaders(cors, traceId),
      },
    );
  }

  if (driveResponse.status === 429) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: withTraceHeaders({ ...cors, "Retry-After": "5" }, traceId),
    });
  }

  if (!driveResponse.ok && driveResponse.status !== 206) {
    console.error("[worker][video] drive upstream error", {
      traceId,
      status: driveResponse.status,
    });
    return new Response(`Upstream error: ${driveResponse.status}`, {
      status: driveResponse.status,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  const responseHeaders = withTraceHeaders(cors, traceId);
  copyPassThroughHeaders(driveResponse.headers, responseHeaders);
  responseHeaders.set("Cache-Control", "private, no-store, max-age=0");

  return new Response(driveResponse.body, {
    status: driveResponse.status,
    headers: responseHeaders,
  });
}

export async function handleThumbnailRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  void ctx;
  const url = new URL(request.url);
  const traceId = getTraceId(request);
  const cors = buildCorsHeaders(env.ALLOWED_ORIGINS, request.headers.get("Origin"));

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  const match = url.pathname.match(/^\/thumbnail\/([^/]+)$/);

  if (request.method !== "GET" || !match) {
    return new Response("Not Found", {
      status: 404,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  const fileId = match[1];
  const unauthorizedResponse = await assertAuthorized(request, url, env, cors, traceId);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const tokenResult = await resolveDriveAccessToken(env, cors, traceId);

  if ("response" in tokenResult) {
    return tokenResult.response;
  }

  const accessToken = tokenResult.token;
  const metadataResponse = await fetchDriveMetadata(fileId, accessToken);

  if (metadataResponse.status === 401 || metadataResponse.status === 403) {
    invalidateTokenCache();
    console.warn("[worker][thumbnail] drive metadata auth rejected", {
      traceId,
      status: metadataResponse.status,
    });
    return new Response("Unauthorized", {
      status: 403,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  if (!metadataResponse.ok) {
    console.error("[worker][thumbnail] metadata upstream error", {
      traceId,
      status: metadataResponse.status,
    });
    return new Response(`Upstream error: ${metadataResponse.status}`, {
      status: metadataResponse.status,
      headers: withTraceHeaders(cors, traceId),
    });
  }

  const metadata = (await metadataResponse.json()) as DriveFileMetadata;

  if (!metadata.thumbnailLink) {
    console.info("[worker][thumbnail] thumbnailLink missing, using default thumbnail", {
      traceId,
      fileId,
    });
    return buildDefaultThumbnailResponse(cors, traceId);
  }

  const thumbnailResponse = await fetch(metadata.thumbnailLink, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!thumbnailResponse.ok) {
    console.warn("[worker][thumbnail] thumbnail fetch failed", {
      traceId,
      status: thumbnailResponse.status,
    });
    return buildDefaultThumbnailResponse(cors, traceId);
  }

  const responseHeaders = withTraceHeaders(cors, traceId);
  copyPassThroughHeaders(thumbnailResponse.headers, responseHeaders);
  responseHeaders.set("Cache-Control", "private, no-store, max-age=0");

  return new Response(thumbnailResponse.body, {
    status: thumbnailResponse.status,
    headers: responseHeaders,
  });
}
