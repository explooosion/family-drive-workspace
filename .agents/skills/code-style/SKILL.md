---
name: code-style
description: Defines reusable TypeScript/TSX code style rules. Apply when writing, reviewing, or refactoring source files to keep code consistent and readable across repositories.
license: MIT
metadata:
  author: explooosion
  version: "2.0.0"
---

# Code Style Rules

Mandatory code style for all TypeScript and TSX source files in this repository.

## When to Apply

Apply **before every code edit or review**, including:

- Writing new components, hooks, utils, or stores
- Refactoring existing code
- Code review or automated fix passes

## Skill Order

When both `vercel-react-best-practices` and this skill are active:

1. Apply `vercel-react-best-practices` first for architecture and performance guidance.
2. Apply `code-style` second for formatting and consistency normalization.

---

## Rule 1 — Import Grouping

Separate `node_modules` imports and relative path imports with **one blank line**.

### Format

```ts
// 1. External (node_modules) imports
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// 2. Relative imports (one blank line above)
import { usePlayerStore } from "../stores/player_store";
import { parseTrack } from "../utils/track_parser";
```

### Rules

| Rule                   | Requirement                                        |
| ---------------------- | -------------------------------------------------- |
| Order                  | External imports first, relative imports second    |
| Separator              | Exactly one blank line between the two groups      |
| No mixing              | Do not interleave external and relative imports    |
| Module-level constants | Place after all imports, not between import groups |
| Path style             | Use one consistent path strategy (relative or alias) within the same file |

### Anti-patterns (Forbidden)

```ts
// WRONG — no blank line between groups
import { useState } from "react";
import { usePlayerStore } from "../stores/player_store";

// WRONG — interleaved
import { useState } from "react";
import { parseTrack } from "../utils/track_parser";
import clsx from "clsx";

// WRONG — const between imports
import { useState } from "react";
const BASE_URL = "...";
import clsx from "clsx";

// WRONG — mixed import strategy in a file
import { usePlayerStore } from "src/stores/player_store";
import { parseTrack } from "../utils/track_parser";
```

---

## Rule 2 — Control Flow Braces

All `if`, `else if`, `else`, `switch`, and `case` blocks **must** use curly braces `{}`. The statement inside **must be on its own line** — single-line block syntax is also forbidden.

### Format

```ts
// ✅ Correct
if (!track) {
  return;
}

if (isPlaying) {
  pause();
} else {
  play();
}

switch (playerState) {
  case "playing": {
    return <FaPause />;
  }
  case "paused": {
    return <FaPlay />;
  }
  default: {
    return null;
  }
}
```

### Rules

| Rule              | Requirement                                                     |
| ----------------- | --------------------------------------------------------------- |
| Braces            | Always required — no exceptions                                 |
| Single-line body  | Must expand to multi-line with braces                           |
| Same-line block   | `{ return; }` on one line is also forbidden — must be multiline |
| `return` only     | Must still use braces                                           |
| `switch` / `case` | Each `case` body must also be wrapped in `{}`                   |
| Ternary           | Allowed only for simple value assignments, not control flow     |

### Anti-patterns (Forbidden)

```ts
// WRONG — no braces
if (!track) return;

// WRONG — single-line block (braces on same line) is also forbidden
if (!track) { return; }

// WRONG — else without braces
if (isPlaying) {
  pause();
} else play();

// WRONG — switch without per-case braces
switch (playerState) { case "playing": return <FaPause />; }
```

---

## Rule 3 — `useEffect` Named Functions

Always use a **named function** as the `useEffect` callback. Anonymous arrow functions are forbidden.

Naming format: `verb + When + trigger condition`

### Format

```tsx
// ✅ Correct
useEffect(
  function focusEditorWhenDialogOpen() {
    if (!open) {
      return;
    }
    editorRef.current?.focus();
  },
  [open],
);

useEffect(
  function registerListenersWhenMenuOpen() {
    if (!open) {
      return;
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  },
  [open],
);

useEffect(
  function saveDraftWhenTracksChange() {
    saveDraft({ name, tracks, categories });
  },
  [name, tracks, categories],
);

// ❌ Forbidden
useEffect(() => {
  saveDraft({ name, tracks });
}, [name, tracks]);
```

### Naming Guide

| Scenario                 | Example                              |
| ------------------------ | ------------------------------------ |
| One-time initialization  | `initAudioContext`                   |
| Depends on a state flag  | `focusEditorWhenDialogOpen`          |
| Multiple deps            | `reloadWhenCollectionOrFilterChange` |
| Register event listeners | `registerListenersWhenMenuOpen`      |
| Sync derived data        | `syncWaveformWhenTracksChange`       |
| Persist state            | `saveDraftWhenTracksChange`          |

---

## Rule 4 — Return Type Inference

**Do not** explicitly annotate return types on function declarations — let TypeScript infer them.

Exception: exported utility functions where an explicit constraint is needed.

```tsx
// ✅ Correct — TypeScript infers the return type
function parseTrackName(rawText: string) {
  return rawText.split(":")[0]?.trim() ?? "";
}

function derivePlayerIcon(state: PlayerState) {
  if (state === "playing") {
    return <FaPause />;
  }
  return <FaPlay />;
}

// ❌ Forbidden — do not annotate return types on local functions
function parseTrackName(rawText: string): string {
  return rawText.split(":")[0]?.trim() ?? "";
}

function derivePlayerIcon(state: PlayerState): React.ReactNode {
  return <FaPlay />;
}
```

---

## Rule 5 — Hook Ordering

`useEffect` hooks **must** be placed **after** all handler functions (`handleXxx`), not before them.

Required order inside a React component body:

1. Variable declarations & derived values
2. `useXxx` hook calls (e.g. `useState`, `useRef`, `useCallback`, store selectors)
3. Handler functions (`handleXxx`)
4. `useEffect` hooks
5. Early-return guards
6. JSX `return`

```tsx
// ✅ Correct order
const [text, setText] = useState("");
const validTracks = parseTrack(text);
const canImport = validTracks !== null;

function handleConfirm() {
  onConfirm(text);
  setText("");
}

useEffect(
  function focusInputWhenOpen() {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
  },
  [open],
);

return <Dialog />;

// ❌ Forbidden — useEffect before handler function
const [text, setText] = useState("");

useEffect(function focusInputWhenOpen() { // ← should be after handleConfirm
  // ...
}, [open]);

function handleConfirm() {
  // ...
}
```

---

## Rule 6 — Minimum Font Size

The minimum allowed Tailwind font size class is **`text-base`** (16 px). All classes smaller than `text-base` are forbidden.

### Forbidden classes

| Class | Size | Status |
| ----- | ---- | ------ |
| `text-xs` | 12 px | ❌ Forbidden |
| `text-sm` | 14 px | ❌ Forbidden |
| `text-[9px]` – `text-[15px]` | < 16 px | ❌ Forbidden |

### Required minimum

| Class | Size | Status |
| ----- | ---- | ------ |
| `text-base` | 16 px | ✅ Minimum allowed |
| `text-lg` and above | > 16 px | ✅ Allowed |

### Anti-patterns (Forbidden)

```tsx
// ❌ WRONG — text-sm (14 px)
<p className="text-sm text-gray-500">File size: 1.2 MB</p>

// ❌ WRONG — text-xs (12 px)
<span className="text-xs uppercase tracking-wider">Label</span>

// ❌ WRONG — arbitrary small size
<p className="text-[11px]">Column header</p>

// ✅ Correct
<p className="text-base text-gray-500">File size: 1.2 MB</p>
<span className="text-base uppercase tracking-wider">Label</span>
<p className="text-base">Column header</p>
```
