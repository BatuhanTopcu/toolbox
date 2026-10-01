# Standalone Research

Create `.artifacts/analyse/research/<slug>/RESEARCH.md` for one bounded question
that informs a decision. Research does not edit product code, create tasks, or
authorize implementation.

## Required Content

- **Question And Scope:** question, why it matters, decision criteria, relevant
  versions/platforms, constraints, and exclusions.
- **Findings:** source-backed answers and option comparisons against those
  criteria; distinguish facts, inference, and unverified claims.
- **Conclusion:** answer or conditional recommendation, material tradeoffs, and
  the conditions that would change it.
- **Evidence:** stable evidence IDs, exact primary URLs/source locators, relevant
  versions/revisions, and verification dates.
- **Uncertainty And Follow-up:** unanswered questions, inaccessible sources,
  contradictions, and bounded next checks.

Start with repository evidence when the question depends on this implementation.
Check authoritative current documentation/types/source for external capabilities.
Do not assume an installed dependency lacks a feature without checking. Record
the actual versions compared rather than claiming all versions behave alike.

Include alternatives only if they are viable under the stated constraints. No
forced option count or comparison matrix is needed. Separate a source's stated
capability from a locally proven integration. Link the exact supporting page and
avoid copying large text into the artifact.

A research artifact is supporting context. If execution needs a concrete change
contract, produce an analysis only when the user requests that next outcome;
do not turn research automatically into an implementation plan or task set.

## Completion Check

- The bounded question is answered or its actual blocker is explicit.
- Consequential conclusions cite direct primary/local evidence.
- Freshness, inference, contradictions, and verification limits are visible.
- Only RESEARCH.md exists; research artifacts never contain tasks.
