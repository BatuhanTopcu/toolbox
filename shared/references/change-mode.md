# Change Analysis

Create `.artifacts/analyse/change/<slug>/ANALYSIS.md` for a proposed change,
problem, or architecture decision. Task files are explicit opt-in.

## Required Content

- **Goal And Scope:** desired outcome, success criteria, affected area, and
  non-goals. Preserve unresolved product decisions.
- **Findings:** trace current behavior/ownership through the relevant path;
  explain contracts, constraints, consumers, failure cases, and cited evidence.
- **Recommendation:** compare actual alternatives, choose the smallest complete
  approach, and describe resulting behavior, sequencing, and verification.
- **Evidence:** stable IDs and current source/command/documentation locators.
- **Risks And Open Questions:** material unknowns, unavailable verification, and
  decisions that an executor cannot infer.

Connect a concrete trigger and current effect to intended behavior. Explain
important boundary/edge cases and rejected approaches only where they change
implementation decisions. Respect current architecture/ADRs; document contrary
evidence instead of silently following a stale decision.

Paths are evidence and likely starting points, not a rigid implementation
allowlist. Show code only when it conveys a required contract more clearly than
a source pointer. Avoid speculative abstractions, compatibility paths, and
unrequested configuration.

If no change is needed, say so with evidence. If a material question prevents a
recommendation, identify the question instead of guessing. Set `ready` only after
required content/evidence are complete, with open choices explicitly recorded;
unfinished required claims retain `draft`. Ready authoring does not establish
pending implementation or resolve those choices for an executor.

## Optional Tasks

When explicitly requested, create one independently verifiable end-to-end task
per requested slice, following [task contract](task-contract.md) and
[orchestration](orchestration.md). Do not create tasks for deferred, rejected,
unrequested, or undecided work. An analysis may propose slices in prose without
creating task files.

## Completion Check

- The chosen outcome follows from cited current evidence.
- Facts, user decisions, assumptions, and unresolved questions are distinct.
- Required contracts/failure behavior and real verification are decision-complete.
- The artifact contains only its main document and explicitly requested tasks.
