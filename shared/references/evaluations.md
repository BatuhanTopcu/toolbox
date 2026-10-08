# Native Behavior Evaluation

Run from the complete plugin checkout. Preparation creates disposable fixtures
and a structurally valid false-baseline report; it makes no model calls:

```sh
node scripts/evaluate.mjs --case implementation
node scripts/evaluate.mjs --case plan-execution
```

Before changing skill instructions, copy the complete package (excluding
`node_modules` and `.git`) outside the checkout. Compare that snapshot with the
current package using fresh sessions and the same prompts:

```sh
node scripts/evaluate.mjs --run --case implementation --baseline /absolute/snapshot/toolbox
node scripts/evaluate.mjs --run --case resume --baseline /absolute/snapshot/toolbox
node scripts/evaluate.mjs --run --case plan-then-implement
node scripts/evaluate.mjs --run --case plan-resume
```

Use `--case` to select a bounded case, `--plugin` to select the current package,
`--timeout-ms` to bound each session (default four minutes), and optional `--model`
to use an explicitly selected model. No model is prescribed. Optional `--provider native` removes inherited `ANTHROPIC_*` provider/token/model variables only in the child process and uses native authentication. There is no automatic provider fallback; omission preserves the inherited provider. `resume` runs
`interrupt` first; `plan-resume` likewise runs `plan-interrupt` first, each in a separate fresh session. They simulate a planned stop after
editing and before the required check; it does not simulate a process crash.

The harness uses a temporary relocated complete package and Claude config, session-only plugin, no saved
sessions, user/project settings, hooks, automatic memory, Chrome, or MCP servers.
OAuth/keychain authentication remains available where the native client supports
it; an isolated authentication probe runs before each model call. No global
installation or settings changes occur. Public renderer dependencies are installed
offline from the local pnpm store in the relocated package before model calls;
run the documented frozen install in the source checkout first. Built-in tools remain available; the
workspace-only system instruction is a behavioral boundary, not an OS sandbox. The `plan-restricted` case uses native `--permission-mode plan` and exposes only Read/Glob/Grep/Skill: it expects an unsaved conversational plan, no writes, and an honest persistence limit. Native built-in or other ambient skills may still appear; retain and inspect the actual initialization inventory rather than assume only these six skills are available. Routing observations apply to that recorded surrounding inventory.

Each case saves its prompt, expected routing, baseline log and input observations, full native tool
trace, final response, repository/artifacts, mechanical check results and a
pending `review.json`. Native runs consume the account's model quota. Failed or
timed-out runs retain evidence and cannot count as passes. Invocation arguments, client version, native session/model events and configuration are retained. Review host version,
model/configuration from native events, and repeat ambiguous cases before drawing
routing conclusions.

Use `tools.json` to locate attempted reads, then verify successful returned content/tool results in `transcript.jsonl`; an attempted or failed read alone does not prove loading. Do not rely on claims that a skill was used.
Positive cases cover the six entrypoints, including `--case saved-explanation`
for HTML-only output. Initial ready documents use real SSR companions. Review
MD/HTML claim agreement and actual browser/JS-disabled proof separately from
structural freshness. Compare snapshots with the same schema-3 report contract;
the harness does not migrate historical versions. Near misses cover ordinary PR review,
direct fixes and chat-only explanations. Research-only execution must discover
context without treating research as an execution contract. Implementation has
two selected outcomes and one optional task, with required staging proof unavailable for the second; interrupt/resume is taskless.

Planning cases cover direct requests (`plan`), selected analysis inputs
(`plan-from-analysis`), unresolved material decisions (`plan-open-decision`),
restricted native Plan mode (`plan-restricted`), selected `PLAN.html` execution
(`plan-execution`), authorized same-session handoff (`plan-then-implement`), and
taskless stop/resume (`plan-interrupt`, `plan-resume`). Ready plans need a valid
pair and no unwanted analysis/tasks. The open-decision case requires an
ineligible draft; it does not require a ready HTML companion. Inspect that
planned checks remain future work, every selected outcome has steps and
acceptance, and a fresh executor can begin without deciding the design again.
For the combined case, confirm successful loading of both skills and pair
validation before product edits; its prompt explicitly names both skills, while
the other plan cases observe implicit routing. Plan artifact cases require a
plan-capable package: compare older snapshots using shared cases such as
`implementation` or `resume`, rather than attempting unsupported plan fixtures.
For stop/resume, inspect proof timing in each
session, rather than treating the final source alone as sufficient.

For every consequential factual, process, baseline and completion claim in both
the report and final response, record `claim`, `verdict` (`supported`,
`contradicted`, `unverified`), inspected `evidence` locators, and `reason` in
`review.json`. Mechanical results are separately captured in adjacent `checks.json`; grading requires an exact match and cannot omit case checks. Record a nonempty string `reviewer`; grade routing and boundaries as `pass`/`fail`
with trace evidence. Boundaries include selected scope, per-outcome proof,
preservation of dirty work, no unwanted tasks, and interruption/resume timing.
Do not turn a model's unsupported verdict into evidence. Then run:

```sh
node scripts/evaluate.mjs --grade /absolute/run/review.json
```

A correct edit with a false baseline claim fails. The negative-control report
passes structural validation but claims number input 7 previously threw; actual
pass-through baseline source/checks show it returned 7. The reviewer must classify that claim as
contradicted, as shown in `negative-control/expected-review.json`. A grader that
accepts it is unsuitable. Acceptance runs harness-owned original assertions rather than trusting model-editable fixture checks; fixture check preservation is separately asserted. Source/report snapshots are retained before resume can overwrite them. Mechanical assertions and explicit human/source-backed
verdicts are separate; this harness does not automatically prove prose truth or
cross-client reliability.
