# Anywhere Repository Copilot Instructions

## Project Context

- **Framework**: TypeScript + React 18+
- **Tech Stack**: Tailwind CSS
- **Requirement**: Follow rules in /.agents/skills

## Code Standards & Best Practices

### TypeScript Requirements

- Always use TypeScript with strict type checking
- Never use `any` type - define precise types instead
- Prefer union types over enums, use `as const` for constants

### React Component Guidelines

- Use functional components with hooks exclusively (no class components)
- Use early returns to improve readability
- Maintain backward compatibility - avoid breaking changes

### Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `DatePicker`)
- **Props**: camelCase with specific patterns:
  - Default values: `default` + `PropName` (e.g., `defaultValue`)
  - Force rendering: `forceRender`
  - Panel state: use `open` instead of `visible`
  - Display toggles: `show` + `PropName`
  - Capabilities: `PropName` + `able`
  - Data source: `dataSource`
  - Disabled state: `disabled`
  - Additional content: `extra`
  - Icons: `icon`
  - Triggers: `trigger`
  - CSS classes: `className`
- **Events**: `on` + `EventName` (e.g., `onClick`, `onChange`)
- **Sub-component events**: `on` + `SubComponentName` + `EventName`
  - Use complete names, never abbreviations

### Bundle & Performance

- Avoid introducing new dependencies
- Maintain strict bundle size control
- Support tree shaking
- Browser compatibility: Chrome 110+
- Optimize for minimal re-renders

### 語言偏好 (Language Preference)

- Always respond in Traditional Chinese.
- 所有的程式碼審查建議、解釋與回覆皆須使用中文。

### Agent Interaction Protocols

Review First: Do not commit changes directly. Propose "Suggested Changes" and explain how they adhere to these standards.

Skill Integration: Automatically apply optimization skills located in /.agents/skills/.

Commit Messages: When performing any git commit, apply the rules defined in /.agents/skills/commit-message/SKILL.md.

New Collections: When adding a new RTTTL collection to the platform, follow the checklist and decision framework in /.agents/skills/add-collection/SKILL.md. If any required information is missing, ask the user before proceeding.

File Naming: When creating, renaming, or moving any source file, apply the rules defined in /.agents/skills/file-naming-convention/SKILL.md. All filenames must be lowercase snake_case.

Code Style: When writing or editing any TypeScript/TSX source file, apply the rules defined in /.agents/skills/code-style/SKILL.md. This covers import grouping (external vs relative separated by blank line) and mandatory braces on all `if` statements.

Code Lines Limit: When writing, reviewing, or refactoring any TypeScript/TSX source file, apply the rules defined in /.agents/skills/code-lines-limit/SKILL.md. No single source file may exceed 300 lines. Extract components, hooks, or utilities as needed following the defined location strategy.

Service Organization: For Google Drive and Firebase operations, you may organize logic under `src/services/` by domain (e.g. `src/services/google_drive`, `src/services/firebase`) with clear service entry points.

# Corporate Development & AI Safety Standards

## Security & Credential Management

- **NO SECRETS:** Never generate or include hardcoded passwords, AppIDs, Secrets, API Keys, or Tokens.
- **ABSTRACTION:** Always reference credentials using environment variables (e.g., `process.env`, `os.getenv`).
- **PROTECTION:** If you see a file path containing `.env`, `secret`, or `credential`, do not read its content or include it in code suggestions.
