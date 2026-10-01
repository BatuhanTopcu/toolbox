# Improvement Audit Playbook

Use these heuristics to find candidates during improvement mode. They are search
prompts, not automatic findings. Report an item only after direct evidence shows
the behavior, consequence, and affected surface.

## Contents

- Ground candidates before reporting
- Correctness
- Security
- Performance and scalability
- Tests and verification
- Architecture and technical debt
- Dependencies and migrations
- UX and accessibility
- Operability and observability
- Developer experience and documentation
- Direction opportunities
- Prioritization checks

## Ground Candidates Before Reporting

- Cite the strongest two to five locations and summarize repeated sites instead
  of listing every match.
- Trace a candidate through callers, inputs, outputs, and tests before asserting
  impact. “Probably slow” or “might be unsafe” is not a finding.
- Distinguish root cause from symptoms and combine duplicates.
- Check repository instructions, ADRs, product documents, and current framework
  conventions before calling an intentional tradeoff defective.
- Treat normal platform behavior as by design unless this implementation adds
  risk: proxy environment variables, standard credential-file discovery, or a
  local developer tool invoking its configured package manager are not findings
  by themselves.
- Report decision drift when code and an ADR/spec disagree; do not use a stale
  decision record to suppress the mismatch.
- Label an uncertain smell as an investigation candidate, never a direct fix.

## Correctness

Inspect:

- Swallowed errors, empty catches, missing failure states, and success reported
  before an operation actually completes.
- Unawaited work, races, missing cancellation/cleanup, stale closures, leaked
  listeners, subscriptions, files, connections, or handles.
- Nullable flows hidden by assertions/casts, unchecked indexing, empty inputs,
  off-by-one boundaries, locale/timezone assumptions, and overflow.
- State combinations that should be impossible, unhandled enum variants, and
  default branches that silently ignore new states.
- Check-then-act races, multi-write operations without atomicity, retries that
  are not idempotent, and jobs/webhooks that can be delivered more than once.
- Type escape-hatch clusters (`any`, unchecked casts, ignore directives) at
  trust boundaries.
- Client/server or producer/consumer contract asymmetry, stale serialization,
  incompatible defaults, and partial-failure behavior.

## Security

Inspect relevant trust boundaries, not only keyword matches:

- Hardcoded or committed credentials and secrets written to logs/history. Never
  copy values; identify type and location only. Recommend removal, rotation, and
  a safer configuration path.
- Request data crossing into SQL, shell, HTML, dynamic execution, filesystem,
  template, archive, or deserialization boundaries without the safer API or
  contextual validation.
- Missing server-side authentication, authorization, tenant/ownership checks,
  request authenticity, webhook signatures, or replay protection.
- Broad object assignment, weak schema validation, and uploads without size,
  type, name, storage, or malware-handling constraints.
- Server-side fetches with user-controlled destinations, redirect/private-network
  bypasses, and unsafe egress assumptions.
- Sensitive data exposed through responses, caches, analytics, errors, logs,
  client bundles, or overly permissive cross-origin policy.
- Cookies, headers, session lifetime, production debug behavior, and cryptography
  that contradict the platform's current secure defaults.
- Critical/high dependency advisories only when the vulnerable path is reachable
  in runtime or build/distribution use. Avoid untriaged audit-command noise.

Describe preconditions, impact, and remediation boundaries. Do not put runnable
exploit payloads into durable artifacts.

## Performance and Scalability

Inspect measured or structurally evident hotspots:

- Query/fetch-per-item patterns, render or request waterfalls, and missing
  batching.
- Repeated scans, avoidable superlinear loops, and duplicate expensive work at a
  clear cache or memoization boundary.
- Unbounded lists, missing pagination, over-fetching, oversized serialization,
  and large data retained longer than necessary.
- Frontend bundle weight, unnecessary client work, rarely used routes without
  splitting, and unoptimized media/fonts when the framework supports it.
- Blocking/synchronous backend work, connection-per-request patterns, and query
  shapes that imply an index candidate. Mark index needs for verification unless
  schema and query-plan evidence confirms them.
- Redundant CI/build work and missing safe caches. Do not claim speedups without
  a baseline or a defensible complexity argument.

## Tests and Verification

Inspect:

- Critical money, auth, mutation, persistence, and primary-product paths with no
  meaningful coverage.
- High-churn modules without tests; prefer characterization before risky
  refactoring.
- Assertions that do not prove behavior, excessive mocking, unreadable snapshots,
  real network/time dependencies, order dependence, and known flaky patterns.
- Missing boundary/integration coverage where units cannot prove a contract, or
  slow end-to-end coverage used for logic a focused test could isolate.
- Regressions without a test at the layer that previously failed.
- Absence of a trustworthy one-command verification path. Treat establishing
  that baseline as a prerequisite when it blocks other work.

Do not recommend a new test framework incidentally when existing checks can
prove the change or the repository has intentionally chosen another strategy.

## Architecture and Technical Debt

Inspect:

- Near-identical logic in three or more places, especially copies that have
  diverged.
- Circular dependencies, layer violations, package-boundary leaks, junk-drawer
  utilities, and implicit shared runtime state.
- Dead modules, fully rolled-out feature-flag branches, obsolete compatibility
  paths, and commented-out implementations.
- Files far larger or more connected than repository peers, deep conditional
  state machines, and interfaces with excessive parameters.
- Multiple competing patterns for the same responsibility; prefer the pattern
  supported by current instructions and recent converged use.
- Premature abstractions with one accidental implementation, or missing
  abstractions where every change requires synchronized edits across many files.

Avoid aesthetic rewrites. Require a concrete correctness, change-cost, ownership,
or verification benefit.

## Dependencies and Migrations

Inspect:

- Core runtime/framework versions approaching end of support or blocking
  security/ecosystem compatibility; ignore low-value version churn.
- Deprecated APIs with removal timelines and abandoned dependencies on critical
  paths.
- Multiple dependencies serving the same purpose and declared dependencies no
  longer used by reachable code.
- Manifest/lockfile drift and inconsistent workspace version policy.
- Storage or protocol changes without required ordering, data-loss prevention,
  idempotency, validation, or a safe rollout strategy. Follow the repository's
  compatibility policy; do not invent compatibility layers or migrations.

Estimate blast radius and migration sequencing before recommending an upgrade.
Use current primary release/security sources for time-sensitive claims.

## UX and Accessibility

When the repository has user-facing surfaces, inspect:

- Missing loading, empty, error, retry, success, destructive-confirmation, and
  recovery states.
- Keyboard access, focus order/visibility, labels, semantic controls, heading
  structure, contrast, reduced motion, and screen-reader announcements.
- Responsive overflow, touch target size, localization expansion, timezone and
  number formatting, and inconsistent interaction patterns.
- Error messages that do not identify the failed action or a recovery path.

Use runtime or screenshot evidence when visual behavior matters; do not infer a
rendered accessibility failure from component names alone.

## Operability and Observability

Inspect:

- Critical failures without actionable structured logs, correlation/request
  identifiers, metrics, traces, or operator-visible health.
- Logs that expose sensitive data or create unbounded noise.
- Retries, timeouts, queues, and background work without saturation, dead-letter,
  or partial-failure visibility.
- Configuration and deployment changes without safe defaults, readiness checks,
  rollback signals, or documented operator steps.

Recommend telemetry only when it answers a concrete operational question.

## Developer Experience and Documentation

Inspect:

- Missing or broken format, lint, typecheck, test, build, dependency, and
  dead-code commands when the repository already uses the corresponding tool.
- Slow feedback loops, redundant CI, absent watch/focused commands, and unclear
  failure messages.
- Incorrect setup steps, undocumented required environment variables, stale
  examples, and absent safe `.env.example` guidance.
- Public APIs/configuration whose behavior is not documented, or docs that
  promise behavior current code does not provide.
- Missing repository/package agent instructions when agents are expected to
  execute task files and local conventions cannot otherwise be discovered.

Do not propose documentation volume for its own sake. Tie it to recurring
onboarding, operational, API, or maintenance friction.

## Direction Opportunities

Ground product-direction candidates in:

- Unfinished intent: coherent TODO clusters, half-built modules, or flags that
  never completed rollout.
- Stated-but-undelivered behavior in PRDs, product docs, roadmaps, examples, or
  documented flags/configuration.
- Surface asymmetry such as export without import or a CRUD/API surface missing
  one operation that current users hand-roll.
- The adjacent possible: a valuable capability unusually cheap because the data
  model or extension boundary nearly supports it.
- Repeated user/developer work around the product that the product could absorb.

Keep direction separate from defects and debt. State who benefits, why now, the
evidence of demand or intent, coarse effort, and honest tradeoffs. Do not revive
an option a current decision record explicitly rejected without new evidence.

## Prioritization Checks

Apply the leverage model and finding schema from
[improve-mode.md](improve-mode.md). Use these tie-breakers:

1. Verification baselines and characterization work that unblock several safe
   fixes come first.
2. High-confidence security/correctness findings outrank equal-leverage polish.
3. Prefer work with a clear acceptance and verification story.
4. Do not let speculative direction displace confirmed operational harm.
5. “Not worth doing” is a valid recorded conclusion when cost or fix risk
   outweighs impact.
