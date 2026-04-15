import { auth } from "../firebase";

const FUNCTIONS_BASE_URL = import.meta.env.VITE_DRIVE_FUNCTIONS_BASE_URL as string;

type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("使用者尚未登入");
  }

  return user.getIdToken();
}

export async function callDriveApi<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!FUNCTIONS_BASE_URL) {
    throw new Error("VITE_DRIVE_FUNCTIONS_BASE_URL is not configured");
  }

  const idToken = await getIdToken();
  const method = options.method ?? "POST";
  const response = await fetch(`${FUNCTIONS_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `functions_error_${response.status}`);
  }

  return response.json() as Promise<T>;
}
