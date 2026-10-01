# Improvement Audit

Create `.artifacts/analyse/improve/<slug>/IMPROVEMENT.md` to find and prioritize
evidence-backed improvements. An audit is not authority to fix findings or create
task files.

## Coverage

State goal, depth, representative paths, covered areas, and exclusions. Select
relevant [audit playbook](audit-playbook.md) categories; do not force every
category into every audit. Depth follows [research workflow](research-workflow.md).

## Findings

Give supported findings stable IDs such as `F-001`. Each includes:

- concrete trigger/current behavior, problem, and affected surface;
- evidence IDs and who experiences the consequence;
- impact, rough effort, fix risk, and confidence;
- recommended direction and observable verification;
- disposition: recommended, deferred, rejected, duplicate, or not worth doing.

Trace inputs, callers, and existing checks before asserting impact. Combine
symptoms sharing one root cause; vet delegated findings against current source.
Keep reproduced defects, source-derived risks, and product opportunities distinct.
An uncertain smell is an investigation candidate, not an authorized fix.

Prioritize impact and confidence relative to effort/risk. Confirmed security and
correctness harm outrank equal-value polish. Verification baselines can precede
fixes they unblock. Record clean areas only when they clarify coverage; report
no actionable findings when that is the evidence-backed result.

## Required Sections

Use `Scope And Coverage`, `Findings`, `Recommendation`, `Evidence`, and
`Risks And Open Questions`. Recommendations explicitly identify the selected,
deferred, and rejected work and preserve missing product choices. Cite source
evidence rather than style preference.

## Optional Tasks

Create tasks only for an explicit task request and only for its selected findings.
Every selected finding is covered; every task cites its finding and repeats the
evidence needed to execute independently. Follow [task contract](task-contract.md)
and [orchestration](orchestration.md). A recommended finding alone does not
authorize a task. Partial task coverage does not redefine the audit's findings.

## Completion Check

- Coverage/exclusions and meaningful verification limits are explicit.
- Findings are supported, nonduplicative, consistently ranked, and actionable.
- Dispositions and unresolved choices are clear.
- Only the main document exists unless tasks were explicitly requested.
