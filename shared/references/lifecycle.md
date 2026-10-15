# Artifact Lifecycle

Current artifacts use schema version 3 in
`.artifacts/analyse/<change|plan|improve|research>/<slug>/`. No historical layout is
migrated automatically.

## Main Document Frontmatter

```yaml
---
schema_version: 3
document_type: analysis
mode: change
slug: example
status: draft
depth: standard
repository:
  root: /absolute/repository/path
  revision: <git-sha-or-none>
  dirty: false
created_at: 2026-01-01T00:00:00.000Z
updated_at: 2026-01-01T00:00:00.000Z
---
```

| Mode | document_type | Main document |
| --- | --- | --- |
| change | analysis | ANALYSIS.md + ANALYSIS.html |
| plan | plan | PLAN.md + PLAN.html |
| improve | improvement | IMPROVEMENT.md + IMPROVEMENT.html |
| research | research | RESEARCH.md + RESEARCH.html |

Each ready artifact requires its exact HTML sibling, built from the final MD bytes.
Follow [HTML reports](html-reports.md) for the public renderer, reader template,
SSR, freshness checks, and browser verification. Explain lives outside this
inventory at `.artifacts/explain/<slug>/EXPLANATION.html`, with no MD or tasks.

Optional numbered `tasks/` belong only to change/plan/improve. Empty task directories,
root README/research logs, task indexes/prompts, and extra delivery files are not
part of this compact contract. Report unsupported artifacts without deleting or
converting them.

## Reconcile

1. Confirm canonical path, schema, mode, slug, repository root, and same intent.
2. Repeat [preflight](research-workflow.md), including affected nested Git roots.
3. Revalidate consequential evidence/decisions. Refresh current claims while
   keeping original implementation baselines clearly historical.
4. Preserve finding/task IDs when their meaning remains the same. Retain closed
   tasks with `done`/`wont-do`; do not delete issued IDs.
5. Update `updated_at` and repository snapshot. Set `ready` when required content
   and evidence are complete, recording unresolved choices explicitly. Retain
   `draft` with the blocker for unfinished required claims.
6. Add tasks only when explicitly requested; refresh existing tasks only when
   they are in scope. Research never has tasks.
7. Render/refresh the HTML after all main metadata/content updates, then validate
   the whole pair and review both audiences, evidence, sources, and actual blockers.

Reject an older schema/layout rather than silently convert it. Choose a new
artifact only for a different requested intent, not to bypass an invalid input.

## Review One Task

Confirm schema 3, owning change/plan/improve artifact, ID/filename, and source. Read
the main document and current cited sources. Tighten outcome, context/contracts,
acceptance, verification, prerequisites, and stop conditions without expanding
scope. Preserve truthful status/ID, update `updated_at`, and validate the entire
artifact because dependencies affect other tasks. Rebuild HTML if main MD changes.

## Status And Completion

- `draft`: main-document authoring is incomplete. Plans stay draft while
  consequential execution decisions are unresolved.
- `ready`: required content/evidence are authored; this does not mean
  unimplemented or resolve recorded product choices. Only ready structurally
  valid change/plan/improve artifacts are execution candidates; resolve consequential
  open decisions before edits. Plan readiness requires a decision-complete
  selected scope; known proof limits remain explicit and cannot be claimed as
  verified by the executor. Research is supporting context.
- `superseded`: historical and no longer authoritative; do not execute it.
- `todo`: task has not started.
- `in-progress`: selected task implementation has begun.
- `blocked`: a recorded stop condition prevents required progress.
- `done`: task outcome and verification are complete.
- `wont-do`: intentionally closed, with a reason; required output may be absent.

The validator checks structure/readiness, not evidence quality, remaining work,
or dependency completion. Inventory shows invalid/draft/superseded artifacts
with reasons rather than hiding them. Historical layouts discovered by explicit
path are reported as unsupported; discovery is bounded to the current project.

## Implementation Records

Keep main authoring status separate from delivery and the current slice.
Append/update `Implementation Verification` in the selected main document.
Account for each selected outcome by existing ID or named contract criterion,
with its disposition (implemented, already satisfied, blocked, or remaining),
actual evidence/check results or missing proof and next required action. Include
affected revisions, expected results, limitations, and deviations; update
`updated_at`. No new schema, IDs, or table format is required.

Write this record only in an optional artifact update: once after implementation
when the user accepts, or before a planned interruption, with selected scope,
current slice, changes, checks, blockers, and next action. Resume rechecks live source and dirty work, preserving
unrelated edits; a record cannot prove completion or expand authorized scope.
For task work, also maintain the task's status and verification record. Preserve
original evidence as the pre-change baseline and cite new evidence as current.
Do not create delivery/index/log/state files. Validate after edits and report the
remaining work honestly; document readiness alone cannot establish completion.
Refresh HTML once per artifact update. Preserve MD
progress and the last complete HTML on rendering failure; report stale paired
readiness. A verified stale/missing companion may be repaired from otherwise
valid schema-3 MD on resume using `validate --content-only` before product edits.
That check is not paired readiness and never permits old-schema execution.
