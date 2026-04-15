export function buildCorsHeaders(
  allowedOrigin: string | undefined,
  requestOrigin: string | null,
): Record<string, string> {
  const allowedOrigins = (allowedOrigin ?? "").split(",").map((origin) => origin.trim());
  const isWildcard = allowedOrigins.includes("*");

  const matchedOrigin = isWildcard
    ? (requestOrigin ?? "*")
    : requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": matchedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Range",
    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
