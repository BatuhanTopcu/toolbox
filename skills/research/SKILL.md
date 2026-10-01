---
name: research
description: Investigate a bounded repository or technical question using primary sources and save a cited conclusion. Use for durable research and API or library comparisons, not full improvement audits or direct implementation.
---

# Research

Create one `.artifacts/analyse/research/<slug>/RESEARCH.md`. Answer a bounded
question with source-backed conclusions and honest uncertainty. Write only
inside the selected artifact; do not edit product code or create task files.

Read [research workflow](../../shared/references/research-workflow.md) and
[research mode](../../shared/references/research-mode.md). Use `standard` depth
unless the user requests `quick` or `deep`.

## Workflow

1. Define the question, decision it informs, constraints, scope, and success
   criteria. Resolve the repository root and run shared preflight.
2. Inspect the destination. Reconcile an artifact with the same intent using
   [lifecycle](../../shared/references/lifecycle.md); obtain another slug for
   a different intent. Do not overwrite or migrate historical layouts.
3. Initialize a new artifact:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts init \
     --repo <repo-root> --mode research --name <slug> \
     --depth <quick|standard|deep>
   ```

4. Establish current local behavior, then research primary sources where local
   evidence is insufficient. Compare options against the stated constraints;
   separate verified facts, inference, and unverified claims.
5. Complete the question, findings, conclusion, evidence, and uncertainty
   sections. Set `ready` only when the scoped conclusion is decision-complete;
   retain `draft` for a required unanswered claim. Update `updated_at`.
6. Validate and re-open the document to check sources, links, freshness, and
   unsupported claims:

   ```sh
   bun <plugin-root>/shared/scripts/artifact-tool.ts validate <artifact-dir>
   ```

`<plugin-root>` is `../..` relative to the directory containing this SKILL.md.
Resolve it from the loaded file's location, not the working directory. Use the
complete plugin checkout and Bun with YAML/Markdown APIs; do not install runtimes
automatically.

`reconcile <artifact-dir>` refreshes an existing research artifact using
lifecycle and research-mode guidance. Research supplies evidence; execution
requires a selected change recommendation or improvement finding.

Report depth, document path, conclusion, remaining uncertainty, and validation.
