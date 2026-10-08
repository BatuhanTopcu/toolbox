# Implementation Planning

Use `plan` for a concrete implementation goal or selected analysis/audit
outcomes. Use `analyse` when investigating whether/why to change something or
comparing consequential architecture choices is the main deliverable. Direct
coding requests need no preliminary plan. Do not silently create another
artifact when planning uncovers an unresolved architectural decision.

## Ground Only The Necessary Decisions

Run [preflight](research-workflow.md), inspect nearby conventions and installed
library capabilities, and trace the source/test/config/export changes needed
for the whole outcome. Research only what can change the approach, steps, or
acceptance. No alternatives quota, fixed task count, word/time minimum, code
transcript, or prescribed agents/models is required.

For a small change, keep each section short and include only working steps.
Do not repeat the same justification, compare irrelevant alternatives, or turn
excluded behavior into new acceptance. Check consequential factual claims
against inspected source/logs before marking ready; unsupported details should
be removed or recorded as uncertainty.

Keep historical baseline checks distinct from target acceptance. An expected
pre-change failure is not a contradictory contract or a reason to rewrite the
checks. While a material decision remains open, block dependent steps rather
than invent preparatory changes merely to make checks pass.

A supplied analysis is provenance, not a prerequisite. Read its selected
outcomes and recheck consequential references. Embed execution-critical
requirements and decisions in the plan in original wording, so another session
can execute without conversation history or an uncopied design choice.
Resolve incidental implementation choices from repository conventions. Ask for
material intent that cannot be discovered; keep consequential unanswered
requirements in a draft rather than guess.

## The Executable Contract

Use the [plan template](../assets/templates/plan.md), keeping each section
proportionate to the work:

- **Outcome And Scope:** observable result, selected outcomes, exclusions,
  acceptance boundary, and meaningful input provenance.
- **Implementation Approach:** current behavior, selected consequential
  decisions, affected ownership, interfaces/failure behavior, and assumptions.
  Include exact signatures/values when they prevent likely mistakes.
- **Implementation Steps:** ordered slices identified by stable descriptive
  names. Each delivers a working observable outcome, names starting source/test
  locations, required prerequisite outputs, and a decisive check. Paths guide
  execution; they are not an allowlist. Grow a working product in layers.
- **Validation And Acceptance:** real repository commands and working
  directories, expected results, relevant edge/failure cases, final end-to-end
  acceptance, and proof that is unavailable. Planned checks are not passes.
  Reuse existing verification setup; do not invent a test framework.
- **Evidence:** a small stable E-ID set with current source/command/document
  locators. Include external primary sources only when needed; embed critical
  knowledge and link the original analysis for provenance.
- **Risks And Open Decisions:** material risks, prerequisites, and stop
  conditions. Explicitly state no open decisions when true.

Self-review whether every selected outcome has a step and acceptance check,
whether dependencies consume real outputs, and whether a fresh executor can
begin without deciding the design again. `ready` means the chosen scope is
sufficiently decided for execution, with explicit low-impact assumptions and
known verification limits. It does not mean approved, unimplemented, or
delivered. Missing consequential choices keep `draft`; `superseded` is historical.
Structural validation does not prove decision completeness or factual accuracy.

## Persistence And Execution

Schema-3 plans live at `.artifacts/analyse/plan/<slug>/PLAN.md` and `PLAN.html`.
Markdown is execution authority; HTML presents the same consequential scope,
steps, decisions, acceptance, evidence, and limits using the shared reader.
Native Plan modes have host-specific writable surfaces. A skill cannot change
those permissions: in a restricted session report an unsaved/unvalidated plan
on its permitted surface, without shell bypasses or permission changes. Native
importers/adapters are outside this workflow.

Only explicitly requested tasks use the existing task contract with
`source: PLAN.md`; do not create tasks just for execution or duplicate progress.
Hand the selected directory, MD, exact HTML sibling, or task directly to
[implementation workflow](implementation-workflow.md). The executor validates,
checks current source/prerequisites, verifies already satisfied outcomes, and
records progress/proof in the same `Implementation Verification` section.
No conversion to analysis or additional investigation is required unless a
material contract has changed. Follow actual user authorization for execution
and publication; a saved plan alone does not authorize either.
