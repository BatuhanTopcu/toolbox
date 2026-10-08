---
name: plan
description: Create a concise implementation plan for a concrete repository change or selected analysis/audit outcomes, with steps and acceptance checks that implement can execute. Use when an implementation plan is requested, not for broad investigation, direct coding, or ordinary code review.
---

# Plan

Create one `.artifacts/analyse/plan/<slug>/PLAN.md` and its `PLAN.html`
sibling. Ground the plan in current source and settle the decisions needed for
execution. Write only inside the selected artifact; do not implement product
changes or publish tasks. An analysis and numbered task files are optional.

Read [plan mode](../../shared/references/plan-mode.md),
[research workflow](../../shared/references/research-workflow.md),
[HTML reports](../../shared/references/html-reports.md), and
[lifecycle](../../shared/references/lifecycle.md). Use `standard` depth unless
quick/deep was requested; scale the plan to the work.

## Workflow

1. Resolve the concrete outcome, selected scope, repository root, and lowercase
   kebab-case slug. Run shared preflight. Read any supplied analysis/audit and
   re-open consequential source references; embed the selected requirements.
2. Inspect the destination. Reconcile the same intent using lifecycle guidance;
   for a different intent, choose another slug. Do not migrate historical layouts.
3. In a write-capable session, initialize a new artifact:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts init \
     --repo <repo-root> --mode plan --name <slug> \
     --depth <quick|standard|deep>
   ```

4. Trace affected callers, contracts, tests, config, and existing capabilities.
   Resolve incidental choices from repository conventions; ask only for material
   intent or missing decisions that source cannot answer. Stop investigating
   when the approach, working steps, and meaningful checks are known.
5. Complete the six template sections. For a one-file change, aim for a few
   hundred words and one working step when the edit/check deliver one outcome;
   expand only for real contracts or dependencies. Avoid repeated facts,
   exhaustive alternatives, and designing excluded behavior. Self-review
   scope-to-step/acceptance coverage, prerequisite outputs, factual claims against
   inspected evidence, and fresh-session usability.
   Set `ready` only when consequential decisions are settled. Keep `draft` for
   material blockers; readiness is authoring, not approval or delivery.
6. Only if tasks were explicitly requested, read
   [task contract](../../shared/references/task-contract.md) and
   [orchestration](../../shared/references/orchestration.md), then use
   `add-task <artifact-dir> --title <title>`. Tasks refer to `PLAN.md`.
7. For a ready plan, finalize `updated_at` and metadata, render HTML, validate
   the whole pair, reopen both views, and run the shared browser checks:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts validate <artifact-dir>
   ```

   For a draft, save the Markdown and report its blockers and validation reasons.
   The renderer requires ready content; do not mark unresolved decisions ready
   to obtain HTML or claim a draft is a valid execution candidate.

Report the pair paths, authoring status, approach, validation and proof limits.
Hand off the selected plan directly to `implement`; do not create an analysis
or tasks to unlock execution. A plan-only request ends here. If the user requests
plan then implement, finish and validate the pair first, then use
[implement](../implement/SKILL.md) in the same authorized workflow when host mode
permits. Add no routine approval gate, commits, or publication side effects.

## Host Permissions And Setup

Loading this skill does not enter or override native Plan mode. If the active
host forbids artifact writes, use its permitted conversational/native plan
surface and report the Toolbox pair unsaved and unvalidated. Persistence needs
a write-capable session. Do not bypass restrictions through shell commands or
present an unsaved plan as an implementation candidate.

`<plugin-root>` is `../..` relative to this loaded SKILL.md, not the working
directory. The complete package, Bun with YAML/Markdown APIs, and renderer
dependencies in that root are required; do not install runtimes automatically.

`reconcile <artifact-dir>` refreshes a same-intent plan; `review-task <task-file>`
reviews an existing selected task. Follow lifecycle/task guidance and validate
the entire pair. Create no unrequested tasks.
