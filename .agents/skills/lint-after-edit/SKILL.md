---
name: lint-after-edit
description: Enforces running lint and build checks after every code modification. Apply after any edit to catch issues before reporting completion.
license: MIT
metadata:
  author: explooosion
  version: "2.0.0"
---

# Lint & Build After Edit

Mandatory lint and build check workflow for a repository. Ensures all code modifications pass static checks and compilation before being considered complete.

## When to Apply

Apply **after every code modification**, including:

- Single-line or multi-line edits
- New components or utilities
- Refactors and renames
- Dependency or import changes

No exceptions.

## Required Steps

### Step 0 — Discover available scripts first

Before running any command, verify the project scripts in `package.json`.

```bash
test -f package.json
node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts||{}).join('\\n'))"
```

Selection rules:

- If `lint` exists, use `npm run lint`.
- If `build` exists, use `npm run build`.
- If script names differ (for example `typecheck`, `check`, `verify`), run the closest equivalent and document it.
- If no `package.json` exists, use the repository's documented check command from README or task config.

### Step 1 — Run lint

```bash
npm run lint
```

Execute from workspace root.

### Step 2 — Run build

```bash
npm run build
```

Execute from workspace root.

### Step 3 — Handle results

| Step  | Result                    | Action                                                                 |
| ----- | ------------------------- | ---------------------------------------------------------------------- |
| lint  | Exit code `0` (pass)      | Proceed to build                                                       |
| lint  | Exit code non-zero (fail) | Fix all errors, re-run lint, confirm pass before proceeding            |
| build | Exit code `0` (pass)      | Report completion normally                                             |
| build | Exit code non-zero (fail) | Fix all TypeScript errors, re-run build, confirm pass before finishing |

## Fix Guidelines

| Error Type                     | Fix                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Unused variable                | Prefix with `_` or remove                                                                   |
| Empty `catch` block            | Add a brief, meaningful comment or handle the error                                         |
| `setState` in `useEffect` body | Refactor data flow first; only suppress with explicit justification when no safer pattern exists |
| TypeScript type error          | Fix the root cause; update types rather than casting to `unknown` or `any`                  |
| Missing import                 | Add the correct import; verify the export exists in the source module                       |
| Any other error                | Fix the root cause; do not silence with `eslint-disable` unless genuinely inapplicable      |

## Rules

- Never deliver code that has lint or build errors.
- Only use `// eslint-disable` comments as a last resort; always explain why in a comment.
- Re-run both lint and build after every fix to confirm the output is clean.
