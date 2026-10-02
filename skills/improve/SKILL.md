---
name: improve
description: Audit a repository or area for evidence-backed improvements and prioritize concrete findings, creating implementation tasks only when requested. Use for improvement audits, not ordinary pull request review or direct fixes.
---

# Improve

Create one `.artifacts/analyse/improve/<slug>/IMPROVEMENT.md` and its `IMPROVEMENT.html` sibling. Report findings
only after verifying the behavior and consequence. Write only inside the
selected artifact; an audit does not authorize implementation or task publication.

Read [HTML reports](../../shared/references/html-reports.md),
[research workflow](../../shared/references/research-workflow.md),
[improve mode](../../shared/references/improve-mode.md), and the relevant areas
of [audit playbook](../../shared/references/audit-playbook.md). Use `standard`
depth unless the user requests `quick` or `deep`.

## Workflow

1. Define scope, covered areas, exclusions, success criteria, repository root,
   and a lowercase kebab-case slug. Run shared preflight.
2. Inspect the destination. Reconcile the same intent using
   [lifecycle](../../shared/references/lifecycle.md); obtain another slug for
   a different intent. Do not overwrite or migrate historical layouts.
3. Initialize a new artifact:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts init \
     --repo <repo-root> --mode improve --name <slug> \
     --depth <quick|standard|deep>
   ```

4. Trace candidates through callers, actual inputs, failures, and existing
   checks. Vet delegated findings against source, combine root-cause duplicates,
   and rank supported findings with impact, effort, risk, and confidence.
5. State recommended, deferred, rejected, duplicate, and not-worth-doing
   dispositions. Keep unresolved product choices visible.
6. Only for an explicit task request, read
   [task contract](../../shared/references/task-contract.md) and
   [orchestration](../../shared/references/orchestration.md). Use
   `add-task <artifact-dir> --title <title>` for selected findings only.
7. Set `ready` only after required content and evidence are complete; record
   unresolved choices explicitly. Retain `draft` for unfinished required claims.
   Update `updated_at`, render the reader HTML from the final MD, then validate the pair:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts validate <artifact-dir>
   ```

8. Re-open the Markdown, HTML, and any tasks; run the shared browser checks. Check evidence, links, finding coverage,
   dependencies, unresolved markers, and honest verification claims.

`<plugin-root>` is `../..` relative to the directory containing this SKILL.md.
Resolve it from the loaded file's location, not the working directory. Use the
complete plugin checkout, Bun with YAML/Markdown APIs, and public rendering
dependencies in the loaded plugin root; do not install runtimes automatically.

## Existing Artifacts

- `reconcile <artifact-dir>` refreshes the audit using lifecycle and improve-mode
  guidance. Add no tasks unless requested.
- `review-task <task-file>` tightens one improvement task using lifecycle and
  task-contract guidance, then validates the whole artifact.

Report depth, Markdown/HTML paths, top findings, and actual validation/browser proof. Include task paths
and real dependency order only when tasks were requested and created.
