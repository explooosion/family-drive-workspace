export function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
