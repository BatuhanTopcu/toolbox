# Implementation Workflow

Execute selected implementation plans, change recommendations, improvement findings,
or task outcomes.
Research documents supply evidence, not authority or an implementation contract.

## Target And Scope

Prefer an explicit artifact/main-document/paired-HTML/task path. Resolve paired
HTML to its exact sibling MD; explain is never an execution target. Otherwise use only an
unambiguous conversation target with execution scope. Without one, list the
current repository's artifacts through the shared helper and obtain selection
before product edits. Offer even a sole candidate rather than silently choose
it; show invalid/draft/superseded reasons and research as supporting context.
An empty inventory needs a supplied plan/analysis/task or a requested plan/analysis first.

Execute plans directly from their approach, named steps, acceptance, evidence,
and open decisions. No conversion to an analysis, extra investigation artifact,
or task generation is required. Reconcile only when material requirements or
contracts have changed; incidental source changes do not require replanning.

For an audit, identify selected finding IDs or an explicitly chosen delivery set.
Do not include deferred, rejected, excluded, optional, or completed findings just
because they are in the report. A generic ambiguous audit execution request needs
a focused scope decision; preserve decisions already made in the conversation.

An explicit task target executes that task's scope. An artifact/finding target
executes selected outcomes regardless of partial optional-task coverage. Reuse
matching tasks, execute uncovered selected outcomes directly, and create no
tasks solely to enable implementation. Read [task contract](task-contract.md)
and [orchestration](orchestration.md) when tasks exist.

## Readiness And Freshness

Validate the selected artifact, then read the full main document, selected
findings/tasks, prerequisites, prior implementation records, and repository
instructions. Do not execute a draft, invalid, or superseded target. It needs
authoring/reconciliation first. Exception: a verified stale/missing HTML
companion may be repaired after `validate --content-only` confirms otherwise
valid schema-3 MD and scope; render and fully validate before product edits.
Do not repair old schemas or invalid claims implicitly. Finish plan/analysis then implement only when that
sequence is in the user's scope. Do not silently repair historical layouts.
Follow [lifecycle](lifecycle.md) for artifact records.

Run [preflight](research-workflow.md): affected Git roots/HEADs, dirty state,
current entry points/callers, contracts, conventions, runtime, and real commands.
Preserve user changes. Umbrella `revision: none` and a previous clean-tree claim
do not establish nested-repository freshness.

Re-open cited sources and compare selected outcomes against live behavior.
Unrelated SHA/file/line changes require review, not automatic rejection. Resolve
changed consequential requirements/contracts before dependent edits; do not
invent an answer to an unresolved product decision. Verify and report already
satisfied outcomes instead of implementing them again. A ready/done label alone
does not establish either outstanding work or current completion.

## Execute And Verify

Start with the smallest end-to-end slice that satisfies the selected contract.
Follow existing architecture, reuse nearby code and installed capabilities, and
remove replaced paths instead of adding speculative compatibility machinery.
Do not trade a working product for unfinished scaffolding.

Follow actual prerequisite outputs. Run unfinished prerequisites within scope
before consumers; missing outputs outside scope need a scope decision. `wont-do`
does not satisfy a dependency by status alone. Record blocked tasks/reasons and
do not start dependents whose required outputs are absent.

Run existing focused checks and broaden only for affected contracts or unresolved
failures. Record command, expected result, actual result, and proof limits.
Distinguish the pre-change baseline from post-change observations; call behavior
pre-existing or unchanged only with baseline evidence, and leave untested or
out-of-scope behavior unverified. Match claimed baseline inputs to captured
proof; post-change probes do not extend a limited baseline. Do not add a test
setup where none exists; use meaningful existing checks or a small runnable
assertion for nontrivial changed logic. Review the resulting behavior
and diff against acceptance, independently when useful, and verify delegated
claims against source.

## Artifact Update

Artifact writes are optional because each MD edit and HTML render costs tokens.
Do not edit the main document, task files, or HTML while implementing. After
the work and checks finish, report results and ask once whether to update the
artifact. Update without asking when the user already requested a record/update
or announced a stop to resume in a fresh session; leave it untouched when they
declined. A declined update leaves the pair unchanged and valid; say that no
implementation record was saved, so a later session cannot resume from one.

When updating, set task status and `updated_at` truthfully. Record selected outcomes and
verification in the main document's `Implementation Verification` section even
when only some selected outcomes have tasks. Account for every selected outcome
using existing finding/task IDs or named contract criteria: state implemented,
already satisfied, blocked, or remaining, with actual supporting evidence/checks
and results or the missing proof, reason, and next required action. A combined
passing check proves only the outcomes it exercises; unavailable required proof
leaves the outcome unresolved. No new IDs, table, or task files are required.

For a planned stop, record selected scope, the current slice, actual changes,
checks, blockers, and the next concrete action in that same section. Keep
current slice separate from main authoring status. On resume, recheck this record
against live source and dirty work, preserve unrelated edits, and continue only
the selected scope; the record is neither completion proof nor new authority.

Preserve original evidence as historical, identify current affected revisions,
and list deviations/remaining scope. Refresh HTML from the final MD and validate
the pair; do not create another delivery/index/log/state artifact.

## Boundaries

Continue authorized work without routine approval between slices. Missing
target/scope, invalid contract, consequential unresolved design, absent required
prerequisite output, or unavailable required verification blocks dependent work.
Continue independent authorized work where possible.

Commit/push/merge, tracker publication, deployments, global installation, and
personal-skill cutover follow the actual user scope and project policies. Do not
make them implicit side effects or seek fresh approval when already authorized.
Report implemented/already satisfied outcomes, real verification, changed paths,
and material remaining blockers; unavailable proof cannot be called complete.
