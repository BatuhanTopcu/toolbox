---
name: analyse
description: Create an evidence-backed analysis of a proposed repository change, with implementation tasks only when requested. Use for durable change decisions and implementation planning, not direct implementation or ordinary code review.
---

# Analyse

Create one `.artifacts/analyse/change/<slug>/ANALYSIS.md` and its `ANALYSIS.html` sibling. Research the actual
behavior and recommend the smallest complete change. Write only inside the
selected artifact; do not implement product changes or publish tasks.

Read [HTML reports](../../shared/references/html-reports.md),
[research workflow](../../shared/references/research-workflow.md) and
[change mode](../../shared/references/change-mode.md). Use `standard` depth
unless the user requests `quick` or `deep`.

## Workflow

1. Resolve scope, success criteria, non-goals, repository root, and a lowercase
   kebab-case slug. Run the shared preflight before drawing conclusions.
2. Inspect the destination. For the same intent, reconcile it using
   [lifecycle](../../shared/references/lifecycle.md); for a different intent,
   obtain another slug. Do not overwrite or migrate historical layouts.
3. For a new artifact, initialize it:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts init \
     --repo <repo-root> --mode change --name <slug> \
     --depth <quick|standard|deep>
   ```

4. Trace the relevant entry points, callers, contracts, failure cases, and
   verification. Complete the document with cited findings, viable alternatives,
   one recommendation, and material unresolved decisions.
5. Only if tasks were explicitly requested, read
   [task contract](../../shared/references/task-contract.md) and
   [orchestration](../../shared/references/orchestration.md). Create tasks for
   the requested slices using `add-task <artifact-dir> --title <title>`.
6. Set `ready` only after required content and evidence are complete; record
   unresolved choices explicitly. Retain `draft` for unfinished required claims.
   Update `updated_at`, render the reader HTML from the final MD, then validate the pair:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts validate <artifact-dir>
   ```

7. Re-open the authored Markdown, HTML, and applicable tasks. Run the shared browser checks. Check evidence, links, dependencies,
   unresolved markers, and verification claims; validation checks structure.

`<plugin-root>` is `../..` relative to the directory containing this SKILL.md.
Resolve it from the loaded file's location, not the working directory. The
complete plugin checkout, Bun with YAML/Markdown APIs, and public rendering
dependencies in the loaded plugin root are required; do not
install runtimes automatically.

## Existing Artifacts

- `reconcile <artifact-dir>` refreshes the change analysis using lifecycle and
  change-mode guidance. Add no tasks unless requested.
- `review-task <task-file>` reviews one task belonging to a change artifact,
  using lifecycle and task-contract guidance. Validate the entire artifact.

Report depth, Markdown/HTML paths, recommendation, and validation result. Report
task paths and real dependency order only when tasks were requested and created.
