---
name: brand-guidelines
description: Applies repository-provided brand colors, typography, and visual rules to output artifacts. Use it when visual consistency with an existing brand system is required.
license: Complete terms in LICENSE.txt
metadata:
  author: explooosion
  version: "2.0.0"
---

# Brand Guidelines

## Purpose

- Apply brand identity consistently across design and content artifacts.
- Prevent ad-hoc color and typography decisions.
- Preserve readability and accessibility while staying on brand.

## When to Apply

Use this skill when:

- A repository contains a defined design system or brand kit.
- The user requests corporate/brand-consistent styling.
- Output includes slides, documents, dashboards, or marketing visuals.

## Input Requirements

Collect these tokens before styling:

| Token | Required | Example |
| --- | --- | --- |
| Primary color | Yes | `#0f172a` |
| Secondary color | Yes | `#334155` |
| Accent color(s) | Yes | `#f97316` |
| Surface/background colors | Yes | `#ffffff`, `#f8fafc` |
| Heading font | Yes | `Poppins` |
| Body font | Yes | `Inter` |
| Logo usage notes | No | Min size / clear space |

If tokens are missing, ask concise follow-up questions and avoid inventing official brand values.

## Styling Rules

### Colors

- Use brand primary/secondary colors for key hierarchy.
- Use accent colors sparingly for calls-to-action and highlights.
- Validate color contrast for accessibility (target WCAG AA minimum).
- Avoid introducing extra colors outside approved palette.

### Typography

- Use heading and body fonts from brand tokens.
- Provide safe fallback stacks when custom fonts are unavailable.
- Keep hierarchy consistent (title, subtitle, body, caption).

### Layout and Components

- Respect spacing rhythm and visual hierarchy.
- Keep icon style, corner radius, and shadow usage consistent.
- Use brand-aligned imagery and illustration style when specified.

## Output Requirements

When this skill is active, outputs should include:

1. A short summary of applied brand tokens.
2. A list of assumptions if any token was missing.
3. Accessible color and typography choices aligned with the provided brand.

## Guardrails

- Do not claim a style is "official" unless explicitly provided by the user or repository.
- Do not copy proprietary brand assets from external sources without permission.
- Prefer neutral defaults when brand constraints are undefined.

## Keywords

branding, corporate identity, visual system, design tokens, typography, color palette, accessibility, visual consistency