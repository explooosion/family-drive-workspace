---
name: git-state-integrity
description: Enforces strict protection of the Git environment. Prohibits the AI from deleting stashes, dropping stashes, or unstaging/resetting changes that have already been staged by the user or previous processes.
license: MIT
metadata:
  author: explooosion
  version: "1.0.0"
---

# Git State Integrity & Protection

This skill establishes mandatory boundaries for Git operations. It ensures that user-managed states—specifically **Staged Changes** and **Git Stashes**—remain untouched by automated AI actions unless explicit permission is granted per instance.

## Core Mandate

You are strictly prohibited from performing any destructive or reversive operations on the current Git state without manual confirmation. 

### Forbidden Operations
- **No Stash Deletion:** Never run `git stash drop`, `git stash clear`, or `git stash pop` if it might result in data loss or conflict.
- **No Unstaging:** Never run `git reset`, `git restore --staged`, or `git reset HEAD <file>` on changes that are already in the "Staged" area.
- **No Force Overwrites:** Do not perform operations that would overwrite uncommitted staged changes.

## Protocol for Conflicts or Requirements

If a task (such as a branch switch, rebase, or merge) requires clearing the stash or unstaging files to proceed, you must follow this protocol:

1. **Immediate Stop:** Cease the automated execution of the Git command.
2. **State Analysis:** Identify exactly which files or stashes are causing the conflict.
3. **Consultation:** Report the conflict to the user. Explain why the current staged/stashed state prevents the requested action.
4. **Await Instruction:** Do not attempt "clever" workarounds (like temporary stashing and dropping). Wait for the user to manually resolve the state or provide explicit consent.

## Required Verification

| Git State | Restricted Action | Required Behavior |
| :--- | :--- | :--- |
| **Staged Changes** | `git reset` / Unstaging | Treat as "Locked." Only add new changes; never remove existing ones. |
| **Git Stash** | `drop` / `clear` / `pop` | Treat as "Read-Only." You may list stashes, but never modify the stack. |
| **Merge Conflicts** | Automated Resolution | If staged changes conflict with a merge, stop and ask for guidance. |

## Rules

- **Respect User Intent:** If a user has staged a file, assume it is ready for commit and must not be altered.
- **Data Safety First:** It is better to fail a command and ask for help than to risk deleting the user's local work history.
- **No Silent Resets:** Never use `--force` flags or "clean" commands that impact tracked or staged files.