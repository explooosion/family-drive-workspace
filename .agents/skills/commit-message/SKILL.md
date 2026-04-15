---
name: commit-message
description: Defines commit message formatting rules for this repository. Apply whenever performing a git commit — including staged commits, squash commits, and amend operations. Enforces single-line, all-lowercase, emoji-free conventional commit format.
license: MIT
metadata:
  author: explooosion
  version: "1.0.0"
---

# Commit Message Rules

Mandatory commit message format for all git commits in this repository.

## When to Apply

Apply **before every git commit**, including:

- Committing staged changes
- Amending previous commits
- Squash and interactive rebase operations
- Auto-generated commits from tooling

## Format

```
<type>: <short description>
```

Single line only. No body. No footer. No multi-line messages.

## Rules

| Rule              | Requirement                                            |
| ----------------- | ------------------------------------------------------ |
| Language          | English only                                           |
| Case              | All lowercase, including the type prefix               |
| Symbols           | No emoji, no special characters, no punctuation at end |
| Line count        | Single line only — no body, no footer                  |
| Description style | Imperative mood, concise, descriptive                  |

## Allowed Type Prefixes

| Prefix      | When to Use                                      |
| ----------- | ------------------------------------------------ |
| `feat:`     | New feature or capability added                  |
| `fix:`      | Bug fix                                          |
| `refactor:` | Code restructured without behavior change        |
| `style:`    | Formatting, whitespace, naming (no logic change) |
| `chore:`    | Build config, dependency updates, tooling        |
| `docs:`     | Documentation changes only                       |
| `test:`     | Adding or updating tests                         |
| `perf:`     | Performance improvement                          |
| `ci:`       | CI/CD pipeline changes                           |
| `revert:`   | Reverts a previous commit                        |

## Examples

```
feat: add dark mode toggle to settings menu
fix: resolve audio playback desync on mobile
refactor: extract create page into multi-component module
chore: update vite to v6
style: normalize tailwind class order in app shell
```

## Anti-patterns (Forbidden)

```
# WRONG — has emoji
feat: ✨ add dark mode

# WRONG — uppercase
Feat: Add Dark Mode

# WRONG — multi-line
feat: add dark mode

closes #42

# WRONG — no prefix
add dark mode toggle

# WRONG — vague
fix: bug fix
```

## How to Determine the Right Prefix

1. Is it a net-new user-facing capability? → `feat:`
2. Does it fix incorrect behavior? → `fix:`
3. Does it change structure without altering behavior? → `refactor:`
4. Is it only formatting or naming? → `style:`
5. Is it tooling, config, or dependencies? → `chore:`
