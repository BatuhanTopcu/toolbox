---
name: implement
description: Implement a selected implementation plan, analysis recommendation, improvement finding, or task with current-source checks and verification. Discover available repository artifacts when context is missing; use for executing these artifacts, not unrelated coding requests.
---

# Implement

Execute the user's selected outcome from a current plan, analysis, or improvement
artifact. Read [implementation workflow](../../shared/references/implementation-workflow.md),
[HTML reports](../../shared/references/html-reports.md),
and [lifecycle](../../shared/references/lifecycle.md). Research documents are
supporting evidence, not execution targets.

## Resolve Missing Context

Use an explicit artifact, main-document, paired HTML, or task path, or an unambiguous current
conversation target with execution scope. Without one, resolve the current
repository root and run:

```sh
bun <plugin-root>/shared/scripts/artifact-tool.ts list --repo <repo-root> --json
```

Show change/plan/improve candidates with title, path, mode, authoring status,
updated date, validation result, and task counts. Show invalid/draft/superseded
artifacts with reasons. Ask for target and scope before product edits, even if
only one candidate exists. If none exist, report the empty inventory and ask
for a plan/analysis/task path or a change to plan/analyse. Never select by age, filename,
or `ready` status; ready means authored, not unimplemented.

## Execute Selected Scope

1. Read the full main document, selected findings/tasks, prior implementation
   records, and current repository instructions. Validate the artifact before
   editing product code. A paired HTML path resolves to its exact sibling MD;
   explain HTML is never an execution target. Repair a verified stale/missing
   companion only after `validate --content-only` confirms current-schema MD
   and selected scope, then render and validate the whole pair:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts validate <artifact-dir>
   ```

   Execute a selected plan directly. Read its approach, named steps, acceptance,
   evidence, and open decisions; no analysis conversion or task generation is
   required. Reconcile only material contract drift before dependent work.

2. Re-open current sources, inspect affected Git roots and dirty work, and
   verify consequential requirements and remaining work. Preserve existing
   edits, including unrelated dirty work on resume. Recheck prior progress
   against live behavior; recorded status does not prove completion or authorize
   more scope. Verify already satisfied outcomes instead of repeating them.
3. An explicit task target executes that task's scope. An artifact/finding
   target executes selected outcomes, even when tasks cover only some of them;
   reuse matching tasks and execute uncovered outcomes directly. Create no
   tasks just to enable implementation. Read
   [task contract](../../shared/references/task-contract.md) and
   [orchestration](../../shared/references/orchestration.md) when tasks exist.
4. Before a substantial taskless slice, record selected scope/current slice in
   the main document's existing `Implementation Verification`. Update actual
   changes, checks, blockers, and next action at boundaries or before a planned
   interruption; refresh the reader HTML after final MD updates; keep current slice separate from main authoring status.
   Follow actual dependencies, implement working end-to-end slices, and run
   repository-supported checks. Missing prerequisite outputs block dependents;
   a `wont-do` status does not satisfy a required output.
5. Record truthful task status and `updated_at`. Account for every selected
   outcome by existing ID or named criterion in `Implementation Verification`:
   implemented, already satisfied, blocked, or remaining, with actual proof or
   its limit and next required action. Include revisions, actual checks,
   deviations, and remaining scope, preserving historical evidence. No new
   tasks, IDs, table, or state files are required. Refresh HTML from final MD,
   validate the pair, and compare reader claims/proof limits. Preserve progress
   and the last complete HTML if rendering fails; report stale readiness.

`<plugin-root>` is `../..` relative to the directory containing this SKILL.md.
Resolve it from the loaded file's location, not the working directory. The
complete plugin checkout, Bun with YAML/Markdown APIs, and public rendering
dependencies in the loaded plugin root are required; do not
install runtimes automatically.

Continue authorized work without routine approval between slices. Resolve
missing target/scope, changed consequential requirements, and unavailable
required verification before dependent work. Commit/push/merge, publication,
deployment, and global installation follow the actual user request and project
policies; they are not automatic side effects of implementation.

Report implemented or already satisfied outcomes, verification, changed paths,
and remaining blockers. Do not claim completion from status metadata alone.
