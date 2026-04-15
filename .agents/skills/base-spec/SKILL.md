---
name: base-spec
description: Defines a reusable project master specification framework. Use this skill to establish a single source of truth for scope, architecture, constraints, workflows, and delivery criteria in any repository.
license: MIT
metadata:
  author: explooosion
  version: "2.0.0"
---

# Base Specification Framework

Use this skill as the baseline contract for any project. It helps the agent collect and maintain one canonical spec before implementation begins.

## Purpose

- Create a single source of truth for product and engineering decisions.
- Reduce ambiguous requirements before coding.
- Keep architecture, constraints, and acceptance criteria aligned.

## Required Specification Sections

Every project spec should include the following sections:

1. Project Overview
2. Goals and Non-goals
3. Target Users and Usage Context
4. Functional Requirements
5. Non-functional Requirements (performance, security, accessibility, reliability)
6. Technical Stack and Architecture
7. Data Model and API Contracts
8. UX and Interaction Constraints
9. Delivery Plan (milestones, release criteria)
10. Validation Plan (tests, lint, build, monitoring)

## Authoring Rules

- Keep requirements implementation-agnostic unless a specific technology is mandatory.
- Mark each requirement with priority (`must`, `should`, `could`).
- Separate hard constraints from recommendations.
- Identify unknowns explicitly; never hide missing information.
- Prefer measurable acceptance criteria over subjective wording.

## Change Management

- Treat spec updates as versioned changes.
- Record rationale for each major change.
- Update dependent skills when base constraints change.

## Output Expectations

When this skill is active, produce:

1. A concise spec summary.
2. A structured checklist of missing information.
3. Suggested implementation order based on requirement priority.