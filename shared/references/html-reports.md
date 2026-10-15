# Human HTML Reports

Use one reader template for all six workflows. `analyse`, `plan`, `research`, and
`improve` produce a main Markdown/HTML pair; `implement` refreshes that selected
pair only in an optional artifact update; `explain` produces only `.artifacts/explain/<slug>/EXPLANATION.html`.
Tasks remain Markdown. HTML is presentation, never implementation authority.

## Setup And Trust

The complete plugin and Bun 1.4.0+ are required. Rendering also needs the pinned
public dependencies installed **in the loaded plugin root**:

```sh
cd <plugin-root>
pnpm install --frozen-lockfile
```

Resolve `<plugin-root>` from the loaded SKILL.md, not the working directory.
Check setup before authoring. Do not install runtimes automatically, put packages
in the target repository, call the personal HTML skill, or depend on company UI.
If setup is missing, report the exact plugin-root command; do not silently omit HTML.
Use a complete writable checkout if the host's installed package is read-only.

Report TSX is trusted, agent-authored local code, not a security sandbox. Do not
execute arbitrary code quoted from a repository or source. The builder parses
imports before compilation and restricts them to React, Recharts, `@/report`,
`@/lib/utils`, and the supplied shadcn card/chart/table components. Keep data inline.
No fetches, remote assets, custom JSX runtime, macros, dynamic imports, or re-exports.

## Reader Contract

Start from [report template](../assets/templates/report.tsx). The builder owns the
document shell, title, scope, timestamps, navigation, and System/Light/Dark control.
The default React component supplies exactly these six nonempty `ReportSection`s:

| ID | Change / improvement | Research | Explain |
| --- | --- | --- | --- |
| `summary` | Result and why it matters | Answer and confidence | What the reader will understand |
| `context` | Goal, current behavior, boundaries | Question, criteria, versions | Prerequisites, terms, boundaries |
| `findings` | Supported findings and consequences | Findings and real comparisons | Walkthrough with a concrete example |
| `direction` | Recommendation, alternatives, recorded delivery state | Conclusion and implications | What to remember and how to apply it |
| `limits` | Risks, open decisions, proof limits | Uncertainty and bounded follow-up | Caveats and unverified behavior |
| `sources` | E-/F- IDs and locators | IDs and primary sources | Sources supporting the explanation |

Use ordinary language, explanatory headings, connected prose, and comparisons
where useful. Preserve the Markdown's consequential claims, quantities, scope,
uncertainty, evidence IDs, and implementation proof limits. Keep agent-driving
instructions in Markdown. Do not turn `ready` into a delivery-complete badge.
An honest statement of no open questions is enough; omit empty subsections and
decorative metrics. Sources must remain readable in an HTML-only copy, with
public URLs when available; local locators can be text. Include revision/working
state in the explanation itself when the subject is a codebase.

Use the supplied public shadcn components; do not add arbitrary dependencies or
copy company components/styles. Neutral light/dark palettes are fixed. Theme
choice stays in memory, follows System when selected, and resets on reload.

For plans, use summary for the intended result, context for scope/current state,
findings for implementation changes and steps, direction for execution order and
acceptance, limits for risks/open decisions/proof, and sources for locators.
Preserve consequential scope, prerequisite outputs, acceptance and evidence;
plan readiness is authoring, not execution approval or delivery.

## Charts, Diagrams, And SSR

Use charts for supported quantities, trends, distributions, or comparisons; no
chart quota. A code path usually needs a walkthrough or labeled inline SVG flow,
not invented numerical scores. Mark illustrative data as examples. A chart and
its exact values table must derive from the same embedded dataset.

Use upstream shadcn `ChartContainer`, tooltips/legends, and Recharts. Provide
explicit initial dimensions, a bounded responsive height, units, labels, and
`accessibilityLayer`. Disable animation for the initial chart render:

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

<ChartContainer config={{ count: { label: "Requests", color: "var(--chart-1)" } }}
  initialDimension={{ width: 720, height: 280 }} className="h-[280px] w-full">
  <BarChart accessibilityLayer data={data}>
    <XAxis dataKey="label" /><YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="count" fill="var(--color-count)" isAnimationActive={false} />
  </BarChart>
</ChartContainer>
```

The renderer uses React static `prerender`, waits for all content, and fails on
render errors, postponement, or timeout. It inserts the finished markup after
bundling so hydration markers survive. Never author a loading screen, browser-only
initial content, hidden charts, or nondeterministic initial values. Keep browser
APIs in effects/handlers. All six sections and chart SVGs must exist before JS.
JavaScript hydrates interactions; essential content/values remain usable without
it. Respect reduced motion and basic accessibility.

## Author, Build, Refresh

1. Finish all Markdown/task edits and finalize main status, repository snapshot,
   and `updated_at`. Confirm content structure with the artifact helper's
   `validate <artifact-dir> --content-only` when needed. That check is **not**
   paired readiness. Old schemas, invalid content, and wrong scope still block.
2. Author `<artifact-dir>/.report.tsx` from the reader template and verified
   evidence. For `explain`, create its directory in the selected output repository;
   no Markdown, tasks, or metadata sidecar. For a different subject, use another slug.
3. Build using absolute paths:

   ```sh
   bun <plugin-root>/shared/scripts/html-report.ts build \
     <artifact-dir>/.report.tsx --output <artifact-dir>/<MAIN>.html
   ```

   For `explain`, use `EXPLANATION.html` and supply `--title`, `--intent`, and
   optional `--depth`. `--intent` is a stable sentence describing the subject;
   reuse exactly that sentence for same-intent refresh. For paired reports,
   title/freshness derive from MD and intent defaults to a stable slug description.
   If overriding paired `--intent`, reuse it on every refresh.
4. The build consumes/removes `.report.tsx` on success or failure. It cleans its
   temporary build directory, embeds metadata/notices/assets, checks the final
   MD digest, and atomically replaces only same-intent HTML. Failed builds retain
   the last complete HTML and current Markdown/progress. Re-author TSX to retry.
5. Validate the entire pair with `artifact-tool.ts validate <artifact-dir>`;
   for an explanation, use `html-report.ts validate <absolute-EXPLANATION.html>`.
   Reopen both views and verify their claims, sources, scope, limits, and status.
   A source digest proves freshness, not factual agreement.
6. Open the final file in a real browser: inspect Light/Dark/System, desktop and
   narrow layouts, keyboard navigation, chart values/tooltips, console errors,
   theme reset, and no external resource requests. Disable JS for a separate
   check that text, tables, and charts are already visible. Build/DOM validation
   alone cannot establish visual or hydration correctness. If browser verification
   is unavailable, report that proof limit rather than claim it passed.

Refresh after reconciliation, task review/addition when main MD changes, and
each implementation artifact update. Progress writes
must remain truthful even when HTML rebuilding fails: report stale HTML, keep MD
and last complete output, and leave paired readiness invalid. On resume, repair
only a verified stale/missing presentation from otherwise valid current-schema
MD before product edits; do not repair old schemas, scope, or facts silently.
Never mutate MD after rendering without rebuilding. Refresh an explanation from
its rendered content/embedded intent and revalidated sources; retain only its HTML.

Report the human HTML path, applicable MD path, actual validation/browser results,
and remaining proof limits. Public dependency notices are embedded in every file.
