import { buildCorsHeaders } from "../utils/cors_utils";
import { verifyFirebaseIdToken } from "../services/firebase_auth";
import { getAccessToken, invalidateTokenCache } from "../services/token_service";
import type { Env } from "../worker_types";

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
  const cors = buildCorsHeaders(env.ALLOWED_ORIGINS, request.headers.get("Origin"));

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const match = url.pathname.match(/^\/file\/([^/]+)$/);

  if (request.method !== "GET" || !match) {
    return new Response("Not Found", { status: 404, headers: cors });
  }

  const fileId = match[1];
  const bearerToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  const queryToken = url.searchParams.get("token")?.trim();
  const firebaseIdToken = bearerToken || queryToken;

  if (!firebaseIdToken) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  try {
    await verifyFirebaseIdToken(firebaseIdToken, env.FIREBASE_PROJECT_ID);
  } catch {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  const rangeHeader = request.headers.get("Range");

  let accessToken: string;

  try {
    accessToken = await getAccessToken(env);
  } catch {
    return new Response("Service unavailable", { status: 503, headers: cors });
  }

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
    return new Response("Unauthorized", { status: 403, headers: cors });
  }

  if (driveResponse.status === 404) {
    return new Response(
      "File not found — ensure the Google Drive folder is shared with the Service Account",
      { status: 404, headers: cors },
    );
  }

  if (driveResponse.status === 429) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { ...cors, "Retry-After": "5" },
    });
  }

  if (!driveResponse.ok && driveResponse.status !== 206) {
    return new Response(`Upstream error: ${driveResponse.status}`, {
      status: driveResponse.status,
      headers: cors,
    });
  }

  const responseHeaders = new Headers(cors);
  copyPassThroughHeaders(driveResponse.headers, responseHeaders);
  responseHeaders.set("Cache-Control", "private, no-store, max-age=0");

  return new Response(driveResponse.body, {
    status: driveResponse.status,
    headers: responseHeaders,
  });
}
