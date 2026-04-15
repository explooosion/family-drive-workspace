---
name: file-naming-convention
description: Defines file naming rules for source code files. Apply whenever creating, renaming, or moving files to enforce all-lowercase snake_case filenames.
license: MIT
metadata:
  author: explooosion
  version: "2.0.0"
---

# File Naming Convention

Mandatory file naming rules for all source code files in this repository.

## When to Apply

Apply **whenever creating, renaming, or moving** any source file, including:

- React components (`.tsx`)
- Pages (`.tsx`)
- Custom hooks (`.ts`)
- Utility functions (`.ts`)
- Store files (`.ts`)
- Constants files (`.ts`)
- Type definition files (`.ts`)

## Format

```
<lowercase_snake_case>.<extension>
```

All characters must be lowercase. Words are separated by underscores (`_`).

## Rules

| Rule           | Requirement                                                                        |
| -------------- | ---------------------------------------------------------------------------------- |
| Case           | All lowercase — no uppercase letters allowed in filenames                          |
| Word separator | Underscore (`_`) only — no hyphens, no camelCase, no PascalCase                    |
| Extension      | Preserve original extension (`.tsx`, `.ts`, `.css`, etc.)                          |
| Index files    | `index.tsx` / `index.ts` are exempt — always kept as-is                            |
| Config files   | Root config files (e.g., `vite.config.ts`, `eslint.config.js`) are exempt          |
| Git history    | Always use `git mv` when renaming to preserve commit history                       |
| macOS rename   | Two-step rename required: `git mv File.tsx _File.tsx && git mv _File.tsx file.tsx` |

## Examples

### Components

```
✅  favorite_button.tsx
✅  canvas_waveform.tsx
✅  music_editor.tsx
✅  app_shell.tsx

❌  FavoriteButton.tsx    (PascalCase)
❌  favoriteButton.tsx    (camelCase)
❌  favorite-button.tsx   (kebab-case)
```

### Hooks

```
✅  use_in_view.ts
✅  use_track_manager.ts
✅  use_keyboard_shortcuts.ts

❌  useInView.ts
❌  useTrackManager.ts
```

### Utils / Stores

```
✅  date_parser.ts
✅  collection_store.ts
✅  audio_engine.ts

❌  date-parser.ts        (kebab-case)
✅  clipboard.ts          (single word — no underscore needed)
```

### Pages

```
✅  landing_page.tsx
✅  collections_page.tsx
✅  favorites_page_route.tsx

❌  LandingPage.tsx
❌  CollectionsPage.tsx
```

### Page Folders (Directory Modules)

When a page or component is split into a folder with an `index.tsx`, the **folder name** also follows snake_case:

```
✅  src/pages/LandingPage/   →   src/pages/landing_page/index.tsx
✅  src/components/CanvasWaveform/  →  src/components/canvas_waveform/index.tsx
```

## Import Path Notes

After renaming, all import paths must be updated accordingly. The component **identifier** (e.g., `export function LandingPage`) remains PascalCase — only the **filename** changes.

```ts
// ✅ Correct — lowercase filename, PascalCase identifier
import { LandingPage } from "./pages/landing_page";
import { FavoriteButton } from "../components/favorite_button";
```

## Anti-patterns (Forbidden)

```
# WRONG — PascalCase component file
FavoriteButton.tsx

# WRONG — camelCase hook file
useInView.ts

# WRONG — kebab-case util file
date-parser.ts

# WRONG — mixed case
MusicEditor.tsx
```
