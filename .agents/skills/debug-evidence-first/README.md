# Debug Evidence First Overview

## Skill Purpose

This skill enforces an evidence-first debugging workflow.
For bug reports, the agent should collect runtime evidence (console logs, targeted test output, reproduction traces) before proposing logic fixes.

## Dependent Tools

| Tool / Extension | Required | Notes |
|------------------|----------|-------|
| Terminal commands | Yes | Used to run targeted tests when available |
| Browser DevTools Console | Optional | Used when user reproduces issue in browser |
| Playwright/Cypress/Vitest/Jest | Optional | Use if already configured in the repository |

## Parameter Requirements

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Bug symptom | string | Yes | Expected behavior vs actual behavior |
| Reproduction action | string | Yes | User action that triggers the issue |
| Environment details | string | No | Browser, OS, runtime, branch, flags |

## Usage Example

```bash
# Apply this skill when handling bug reports and incident diagnosis.
```
