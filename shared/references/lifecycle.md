# Artifact Lifecycle

Current artifacts use schema version 2 in
`.artifacts/analyse/<change|improve|research>/<slug>/`. No historical layout is
migrated automatically.

## Main Document Frontmatter

```yaml
---
schema_version: 2
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
| change | analysis | ANALYSIS.md |
| improve | improvement | IMPROVEMENT.md |
| research | research | RESEARCH.md |

Optional numbered `tasks/` belong only to change/improve. Empty task directories,
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
7. Validate and review evidence, links, unresolved markers, and actual blockers.

Reject an older schema/layout rather than silently convert it. Choose a new
artifact only for a different requested intent, not to bypass an invalid input.

## Review One Task

Confirm schema 2, owning change/improve artifact, ID/filename, and source. Read
the main document and current cited sources. Tighten outcome, context/contracts,
acceptance, verification, prerequisites, and stop conditions without expanding
scope. Preserve truthful status/ID, update `updated_at`, and validate the entire
artifact because dependencies affect other tasks.

## Status And Completion

- `draft`: analysis/research authoring is incomplete.
- `ready`: required content/evidence are authored; this does not mean
  unimplemented or resolve recorded product choices. Only ready structurally
  valid change/improve artifacts are execution candidates; resolve consequential
  open decisions before edits. Research is supporting context.
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

Before substantial taskless work, record selected scope/current slice there;
update changes, checks, blockers, and next action at slice boundaries or before
a planned interruption. Resume rechecks live source and dirty work, preserving
unrelated edits; a record cannot prove completion or expand authorized scope.
For task work, also maintain the task's status and verification record. Preserve
original evidence as the pre-change baseline and cite new evidence as current.
Do not create delivery/index/log/state files. Validate after edits and report the
remaining work honestly; document readiness alone cannot establish completion.
