import { describe, expect, it } from "vitest";

import { ensureInSharedScope } from "./drive";

type ParentMap = Record<string, string[]>;

function createFakeDrive(parentMap: ParentMap) {
  return {
    files: {
      get: async ({ fileId }: { fileId: string }) => {
        return {
          data: {
            id: fileId,
            parents: parentMap[fileId] ?? [],
          },
        };
      },
    },
  };
}

describe("ensureInSharedScope", () => {
  it("passes when node is inside shared folder tree", async () => {
    const drive = createFakeDrive({
      child: ["album"],
      album: ["shared-root"],
    });

    await expect(
      ensureInSharedScope(
        drive as Parameters<typeof ensureInSharedScope>[0],
        "child",
        "shared-root",
      ),
    ).resolves.toBeUndefined();
  });

  it("throws forbidden_scope when node is outside shared folder tree", async () => {
    const drive = createFakeDrive({
      child: ["other-root"],
      "other-root": [],
    });

    await expect(
      ensureInSharedScope(
        drive as Parameters<typeof ensureInSharedScope>[0],
        "child",
        "shared-root",
      ),
    ).rejects.toThrowError("forbidden_scope");
  });
});
