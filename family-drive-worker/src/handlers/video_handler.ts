import { buildCorsHeaders } from "../utils/cors_utils";
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
  const url = new URL(request.url);
  const cors = buildCorsHeaders(env.ALLOWED_ORIGIN, request.headers.get("Origin"));

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const match = url.pathname.match(/^\/file\/([^/]+)$/);

  if (request.method !== "GET" || !match) {
    return new Response("Not Found", { status: 404, headers: cors });
  }

  const fileId = match[1];
  const rangeHeader = request.headers.get("Range");
  const cacheUrl = `https://drive-cache.worker/file/${fileId}`;
  const cacheRequest = new Request(cacheUrl);
  const cache = caches.default;

  if (!rangeHeader) {
    const cached = await cache.match(cacheRequest);

    if (cached) {
      const cacheHit = new Response(cached.body, cached);
      Object.entries(cors).forEach(([key, value]) => cacheHit.headers.set(key, value));

      return cacheHit;
    }
  }

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
  responseHeaders.set("Cache-Control", "public, max-age=3600");

  const response = new Response(driveResponse.body, {
    status: driveResponse.status,
    headers: responseHeaders,
  });

  if (driveResponse.status === 200 && !rangeHeader) {
    ctx.waitUntil(cache.put(cacheRequest, response.clone()));
  }

  return response;
}
