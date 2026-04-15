---
name: debug-evidence-first
description: Evidence-first debugging workflow. For bug reports, collect runtime evidence (browser console logs, test logs, and reproduction output) before proposing or implementing logic changes.
license: MIT
metadata:
  author: mapxus
  version: "1.1.0"
---

# Debug Evidence First

## Core Principle

Never guess-fix from text description alone. For bug reports, collect evidence first, diagnose second, fix third.

## Workflow

### Step 1 - Clarify the symptom

Identify and restate:

- Expected behavior
- Actual behavior
- Trigger action
- Scope (always, intermittent, environment-specific)

### Step 2 - Locate suspect paths

Without changing business logic, find likely execution points:

- Event handlers
- useEffect callbacks
- Async requests / mutations
- State derivation and guards

### Step 3 - Instrument targeted logs first

Add focused debug logs with a consistent prefix.

Log requirements:

- Include location + intent in label
- Print key primitives and branch decisions
- Avoid dumping huge objects unless necessary
- Never log secrets, tokens, or PII

```ts
console.log("[ProfileSave] submit clicked, userId:", userId);
console.log("[saveWhenFormValid] valid:", isValid, "dirty:", isDirty);
console.log("[saveRequest] status:", response.status, "ok:", response.ok);
```

### Step 4 - Reproduce and collect evidence

Prefer this order:

1. Run available automated checks in current environment.
2. If browser/runtime interaction is needed, ask the user to reproduce and share logs.

Automated checks guidance:

- If test tooling is configured (for example Playwright, Vitest, Cypress, Jest), run the smallest relevant test first.
- Capture command, failing assertion, and stack trace.
- Do not broaden to full-suite runs unless needed.

User reproduction request must include:

1. Exact clicks/inputs to perform
2. Where to open logs (Browser DevTools -> Console)
3. Exact prefixes/lines to copy back

Example message:

> Please reproduce the issue by clicking "Save" on the profile page.
> Open DevTools -> Console and copy all lines starting with:
> - [ProfileSave]
> - [saveWhenFormValid]
> - [saveRequest]

### Step 5 - Diagnose from evidence

Use returned logs/test output to identify the first divergence from expected behavior.

- Pinpoint file, condition, and failing branch
- Explain why the behavior diverges
- Propose fix only after this evidence step

### Step 6 - Fix and clean up

After a fix is verified:

- Remove temporary debug logs
- Keep only meaningful permanent error logging
- Re-run the relevant validation checks

## Rules

- Do not implement business-logic changes before first evidence collection.
- Do not add more than 5 temporary log points in one pass.
- Prefer console logs for transient debugging; reserve warn/error for real error handling.
- If first-pass logs are inconclusive, add a second deeper pass.
- Always ask for reproducible output when local runtime is unavailable.
- If local browser automation is available, run it and include key output in diagnosis.


## Output Contract

For a bug-report response, output in this order:

1. Symptom summary (expected vs actual)
2. Suspect locations
3. Proposed temporary logs (or test command)
4. Reproduction instructions for user
5. Specific evidence requested back
