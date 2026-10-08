# Optional Task Orchestration

Read for explicitly requested task creation or execution of existing tasks.
Numbered task files are the complete handoff. No index, execution prompt,
dependency dashboard, or separate research log is required.

## Creating Tasks

1. Slice only the scope requested into independently verifiable outcomes.
2. Repeat necessary evidence/contracts and cite the source recommendation,
   plan step, or finding; follow [task contract](task-contract.md).
3. Add `depends_on` only for required outputs/contracts, not filename order.
4. Exclude deferred, rejected, speculative, unrequested, and undecided work.

## Selecting And Executing

An explicit task target executes its scope. An artifact/finding target executes
the selected outcomes even if existing optional tasks cover only some of them.
Reuse matching tasks; implement selected uncovered outcomes directly. Do not
create missing task files merely to unlock execution or infer additional scope
from task existence.

Re-open current evidence and required prerequisites. A `done` label is recorded
progress, not proof of present output; verify the contract. `wont-do` is not a
substitute for the required output. Run unfinished prerequisites that are within
the selected scope before dependents. If a prerequisite lies outside scope and
its output is absent, identify the needed scope decision and block dependent
work rather than silently expand the request.

Tasks without an actual dependency can proceed independently only when they do
not share contracts, lockfiles, generated output, runtime state, or code ownership.
Choose parallel work from real independence, not a fixed agent count or model.

Update `in-progress` when work starts, `done` only after outcome and verification
are complete, or `blocked` with a specific reason when a stop condition applies.
Do not run dependents of missing/blocked outputs. Update `updated_at` and validate
the whole artifact after metadata or dependency changes.

Report selected task IDs/paths, actual results, and blockers. Keep progress and
verification in the selected task/main document instead of another artifact.
