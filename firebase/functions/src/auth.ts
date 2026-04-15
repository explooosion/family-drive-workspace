import type { Request } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp();
}

export type AuthUser = {
  uid: string;
  email?: string;
  role: UserRole;
};

export type UserRole = "admin" | "member";

function toUserRole(value: unknown): UserRole {
  if (value === "admin") {
    return "admin";
  }

  return "member";
}

export function requireRole(user: AuthUser, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error("forbidden_role");
  }
}

export async function requireAllowedUser(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("unauthorized");
  }

  const idToken = authHeader.slice("Bearer ".length);
  const decoded = await getAuth().verifyIdToken(idToken);
  const userDoc = await getFirestore().collection("users").doc(decoded.uid).get();

  if (!userDoc.exists) {
    throw new Error("forbidden");
  }

  const userData = userDoc.data() as { email?: unknown; role?: unknown };
  const storedEmail = typeof userData.email === "string" ? userData.email.toLowerCase() : undefined;
  const decodedEmail = decoded.email?.toLowerCase();

  if (storedEmail && decodedEmail && storedEmail !== decodedEmail) {
    throw new Error("forbidden_email");
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    role: toUserRole(userData.role),
  };
}
