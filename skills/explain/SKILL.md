---
name: explain
description: Save a readable HTML explanation of a topic or codebase with a concrete walkthrough, sources, and helpful charts or diagrams. Use when explicitly invoked or when a saved HTML explanation is requested; not for chat-only explanations, research decisions, direct fixes, or PR reviews.
---

# Explain

Create only `.artifacts/explain/<slug>/EXPLANATION.html` in the selected output
repository. Read [HTML reports](../../shared/references/html-reports.md) and the
relevant evidence/preflight guidance in [research workflow](../../shared/references/research-workflow.md).
Use `standard` depth unless requested otherwise. Do not edit product code,
produce Markdown/task/sidecar artifacts, or authorize implementation.

1. Resolve subject, audience, depth, output repository, lowercase kebab-case slug,
   and a stable intent sentence. Inspect any existing same-slug HTML and embedded
   intent. Reconcile the same subject; use another slug for a different subject.
   Preserve unsupported files rather than overwrite or migrate them.
2. Check the loaded plugin's public rendering dependencies. For a codebase,
   inspect current entrypoints, state/data flow, ownership boundaries, relevant
   versions and Git/dirty state; trace one representative example end to end.
   For a general topic, use authoritative sources when required and do not scan
   an unrelated codebase or invent a Git revision.
3. Teach the subject in the shared six-section template: clear summary/context,
   walkthrough and concrete example, practical implications, caveats, and sources.
   Distinguish facts, examples, simplifications, and unknowns. Use diagrams or
   supported charts when they improve understanding; no forced change proposal.
4. Author temporary `.report.tsx`, then build the canonical HTML with `--title`,
   `--intent`, and `--depth` through the shared renderer. It waits for complete
   SSR, embeds assets, consumes temporary source, and refreshes only the same intent.
5. Validate with `html-report.ts validate <absolute-EXPLANATION.html>`, reopen it,
   compare claims/sources, and perform the shared browser/JS-disabled checks.
   The final directory must contain only `EXPLANATION.html`.

`<plugin-root>` is `../..` relative to this SKILL.md directory. Resolve shared
resources there, not from cwd. Report depth, HTML path, validation, actual browser
proof, and consequential limits. Explain artifacts never enter implementation
inventory; follow-up implementation needs a selected plan/change/improvement contract.
