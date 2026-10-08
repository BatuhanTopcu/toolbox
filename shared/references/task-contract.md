# Task Contract

Read when task files were explicitly requested, an existing task is reviewed,
or implementation consumes existing tasks. Tasks exist only for change/plan/improve
artifacts and must be executable without conversation history.

## Frontmatter

```yaml
---
schema_version: 3
document_type: task
id: "001"
title: Example task
source: ANALYSIS.md
status: todo
depends_on: []
created_at: 2026-01-01T00:00:00.000Z
updated_at: 2026-01-01T00:00:00.000Z
---
```

- Stable three-digit `id` matches the numbered filename.
- `source` is ANALYSIS.md, PLAN.md, or IMPROVEMENT.md in the artifact root.
- `status` is `todo`, `in-progress`, `blocked`, `done`, or `wont-do`.
- `depends_on` contains existing unique task IDs in an acyclic graph. IDs need
  not be earlier filenames; order alone is not a dependency.
- Retain closed tasks with truthful status and reason. Do not delete issued
  tasks or renumber them: allocation uses the maximum present ID plus one.

## Body

- **Outcome:** observable end state and the source recommendation/plan step/finding.
- **Context And Requirements:** current behavior/evidence, consequential
  decisions, contracts, boundaries, and relevant rejected approaches. Repeat
  the evidence needed for this scope; the main artifact supplies provenance.
- **Acceptance Criteria:** observable outcomes, meaningful edge/failure cases,
  and relevant negative behavior.
- **Verification:** actual repository commands/checks, expected result, and
  what each proves. Include a convention exemplar when it changes execution.
- **Stop Conditions:** missing decisions, changed consequential claims, missing
  prerequisite output, or unavailable required checks that prevent safe work.

Paths are evidence/starting points, not an implementation allowlist. An executor
may change the repository files necessary for the authorized outcome.

## Slices And Dependencies

Make each slice independently verifiable and reviewable end to end. Merge
overlapping slices that cannot be reviewed separately. Add a dependency only
when a task consumes another task's output/contract; avoid horizontal scaffolding.
Use [orchestration](orchestration.md) for creation and execution behavior.

Use existing verification commands and test setup. Check that a command/script
exists before claiming it is available. Do not claim unavailable CI, runtime
proof, credentials, deployment, or migrations. Record an unavailable check and
its smallest authorized follow-up.
