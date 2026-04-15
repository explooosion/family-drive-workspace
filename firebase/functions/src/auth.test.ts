import { describe, expect, it } from "vitest";

import { requireRole, type AuthUser } from "./auth";

function createUser(role: AuthUser["role"]): AuthUser {
  return {
    uid: "u1",
    email: "user@example.com",
    role,
  };
}

describe("requireRole", () => {
  it("allows admin when admin role is required", () => {
    expect(() => {
      requireRole(createUser("admin"), ["admin"]);
    }).not.toThrow();
  });

  it("rejects member when admin role is required", () => {
    expect(() => {
      requireRole(createUser("member"), ["admin"]);
    }).toThrowError("forbidden_role");
  });
});
