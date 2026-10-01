# Analysis agent plugin

Four focused skills share one evidence workflow, artifact helper, and set of templates. Source: [BatuhanTopcu/analysis-agent-plugin](https://github.com/BatuhanTopcu/analysis-agent-plugin). The package derives from [agent-plugin-template](https://github.com/BatuhanTopcu/agent-plugin-template) and uses native skill discovery in Codex, Claude Code, Cursor, pi, and OpenCode V2.

| Skill | Use it for | Saved result |
| --- | --- | --- |
| `analyse` | A proposed repository change and concrete recommendation | `.artifacts/analyse/change/<slug>/ANALYSIS.md` |
| `research` | A bounded technical question and primary-source conclusion | `.artifacts/analyse/research/<slug>/RESEARCH.md` |
| `improve` | An evidence-backed repository improvement audit | `.artifacts/analyse/improve/<slug>/IMPROVEMENT.md` |
| `implement` | Execution of a selected analysis, audit finding, or task | Product changes and verification recorded in the selected artifact |

Analysis and audits create tasks only when requested. Research creates no tasks. Without a target in the conversation, implement lists available artifacts and obtains selection before changing product code. A document marked `ready` is authored; it may already describe completed work. Implementation records account for every selected outcome with a disposition and actual proof or limit. Taskless work keeps its current slice and next action in that same record so a fresh session can recheck and resume selected scope.

## Requirements and authoring

The artifact helper requires **Bun with `Bun.YAML.parse`, `Bun.YAML.stringify`, and `Bun.markdown.render`**; Bun 1.4.0 is verified locally. It fails clearly when those APIs are unavailable. The package does not install runtimes automatically.

Authoring checks require Node **24.15+**, pnpm **10.33.0**, and Bun on PATH:

```sh
pnpm install --frozen-lockfile
pnpm validate
```

Edit `plugin.json` for identity, `skills/` for entrypoints, and `shared/` for common resources. Build refreshes the native manifests, marketplaces, and package identity. Commit generated files alongside source when publishing a repository. `pnpm check` validates their freshness without rebuilding.

The [GitHub Actions check](.github/workflows/check.yml) installs pinned Node, pnpm, and Bun versions, then runs `pnpm check` on pushes and pull requests.

```text
skills/{analyse,research,improve,implement}/SKILL.md
shared/references/              Workflows and artifact contracts
shared/scripts/artifact-tool.ts Bun artifact commands
shared/assets/templates/       Main-document and opt-in task templates
scripts/                       Native registrations, checks, and bounded evaluations
```

Skills link directly to `../../shared/...`. **Install the complete checkout**, including shared resources. Copying only one skill directory or sparse-checking out `skills/` breaks those references.

## Invocation and artifact commands

Use the host's skill invocation, or describe the matching work. For example, Codex uses `$analyse`, `$research`, `$improve`, and `$implement`; Claude uses `/analysis-agent-plugin:analyse`; pi uses `/skill:analyse`.

```text
$analyse assess moving this service to streaming responses
$research compare the installed SDK's streaming APIs against its documentation
$improve audit the payment module for concrete reliability improvements
$implement .artifacts/analyse/change/streaming-responses/ANALYSIS.md
$implement
```

The last invocation lists inputs and asks for a target. It does not select the latest artifact or execute every finding.

Run the helper from any repository using its absolute installed path:

```sh
bun /absolute/path/analysis-agent-plugin/shared/scripts/artifact-tool.ts init \
  --repo /absolute/project --mode change --name streaming-responses
bun /absolute/path/analysis-agent-plugin/shared/scripts/artifact-tool.ts list \
  --repo /absolute/project --json
bun /absolute/path/analysis-agent-plugin/shared/scripts/artifact-tool.ts validate \
  /absolute/project/.artifacts/analyse/change/streaming-responses
```

Modes are `change`, `improve`, and `research`. `add-task <artifact-dir> --title <title>` is reserved for explicitly requested change/audit tasks. The inventory derives from local files, includes invalid artifacts with reasons, and creates no index or cache. Historical unsupported layouts are reported without migration.

To keep `.artifacts/` out of Git across repositories, optionally add it to [Git's global ignore file](https://git-scm.com/docs/gitignore). This command preserves existing rules and uses your configured file or Git's default location:

```sh
ignore_file="$(git config --global --path core.excludesFile || true)"
ignore_file="${ignore_file:-${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore}"
mkdir -p "$(dirname "$ignore_file")"
touch "$ignore_file"
grep -qxF '.artifacts/' "$ignore_file" || printf '\n.artifacts/\n' >> "$ignore_file"
```

Git ignore rules do not affect files already tracked.

## Installation

These commands are manual installation instructions. Creating or validating this package does not register it globally or replace personal skills. Clone the complete package for local use:

```sh
git clone https://github.com/BatuhanTopcu/analysis-agent-plugin.git
```

**Codex:** use the native plugin CLI with the GitHub repository as marketplace source:

```sh
codex plugin marketplace add https://github.com/BatuhanTopcu/analysis-agent-plugin.git --ref main
codex plugin add analysis-agent-plugin@analysis-agent-plugin-marketplace
```

For a local preview, pass `/absolute/path/analysis-agent-plugin` to `marketplace add` instead.

**Claude Code:** for a session-only preview, use:

```sh
claude --plugin-dir /absolute/path/analysis-agent-plugin
```

For a lasting user installation:

```sh
claude plugin marketplace add BatuhanTopcu/analysis-agent-plugin --scope user
claude plugin install analysis-agent-plugin@analysis-agent-plugin-marketplace --scope user
```

**Cursor:** copy the complete package, excluding `node_modules`, into `~/.cursor/plugins/local/analysis-agent-plugin`; reload the window and enable it in Customize. External symlinks are not the installation route. Organization policy may require Allow Local Plugin Imports.

**pi:** install the complete package from GitHub, then restart pi:

```sh
pi install https://github.com/BatuhanTopcu/analysis-agent-plugin.git
```

`pi.skills` registers the shared skill tree. This package needs no pi extension, MCP API, or extension-specific minimum version.

**OpenCode V2:** register native skills in the target project:

```sh
node /absolute/path/analysis-agent-plugin/scripts/configure.mjs opencode \
  --project /absolute/project
```

The command preserves existing settings and merges one absolute `skills` path into `opencode.json`. If `opencode.jsonc` exists, it prints the required entry for manual merging to preserve comments. Keep the full checkout at that path. No custom OpenCode adapter or runtime package is needed.

The plugin is unreleased; its first release will be `0.0.1`. Run `pnpm validate` to regenerate and check native/package metadata, then publish this complete directory as the GitHub repository root, including its hidden manifest directories, shared resources, lockfile, and LICENSE. Commit the package and publish an immutable `v0.0.1` tag. Bump `plugin.json` for subsequent releases. Distribute that same package to each host; start a fresh session after updating it. Do not mix entrypoints and shared resources from different releases.

For source-added Claude marketplaces, the manifest version takes precedence and an unchanged computed version skips copied-install updates. Local-directory plugins loaded in place are an exception. A new Git commit/tag alone does not refresh a copied package with a pinned manifest version. See [Claude's version rules](https://code.claude.com/docs/en/plugins/loading#versions-and-updates).

## Verification and provenance

`pnpm check` checks the portable schema, generated registrations, all local Markdown resource links within the plugin root, OpenCode configuration preservation, and deterministic Bun fixtures for research, inventory, dependency validation, and escaping paths. It also relocates the complete package, checks copied links, and runs the copied helper from a separate repository against a marked copied template. Structural validation and relocation do not prove evidence quality, native discovery, or model compliance with instructions.

For reproducible native behavior and implicit routing checks, use [evaluation guidance](shared/references/evaluations.md): `pnpm evaluate` prepares fixtures without model calls; `pnpm evaluate --run` executes them. Model runs use temporary repositories and session-only plugins, and keep evidence for review. Mechanical assertions and source-backed review of consequential report/final claims are separate checks. Retain a before-change package for comparisons; do not infer general reliability from one successful run.

Earlier local checks discovered all four skills in pi 0.74.1 and Claude Code 2.1.247. A fresh Claude `implement` listed artifacts and requested target/scope; a taskless fixture changed selected behavior and passed its check, but its report made a false claim about excluded baseline behavior. That historical failure motivated the claim review and negative control.

On 2026-10-01, fresh Claude 2.1.247 initialization discovered all four commands in relocated v0.1.0 and v0.2.0 packages. Both taskless comparison sessions hit configured-provider retries before assistant/tool actions; a separate isolated native-provider health probe returned “Not logged in.” Current behavior, routing, outcome accounting and resume compliance remain unverified. Native initialization also inventories other available skills, so any future routing result must retain that surrounding inventory.

An isolated temporary Git marketplace/cache check confirmed that a same-version commit left copied v0.1.0 content unchanged, while a temporary bump to v0.1.1 copied changed shared content, all four skill directories and the helper. User configuration hashes remained unchanged. Those test versions and the earlier v0.2.0 development snapshot were never released; the package's current unreleased version is v0.0.1. This experiment verifies copied-cache updates, not model compliance or release publication. Codex, Cursor, and OpenCode installed runtime behavior remains untested for this derivative.

The workflows use original wording informed by [Matt Pocock's research](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/engineering/research/SKILL.md), [implementation](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/engineering/implement/SKILL.md), [task slicing](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/engineering/to-tickets/SKILL.md), and [shared skill mechanics](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/productivity/writing-for-agents/SKILL-MECHANICS.md); [shadcn's audit](https://github.com/shadcn/improve/blob/cac56e1ebd3c279aa9153616cfeac7b174ab90f9/skills/improve/SKILL.md) and [execution loop](https://github.com/shadcn/improve/blob/cac56e1ebd3c279aa9153616cfeac7b174ab90f9/skills/improve/references/closing-the-loop.md); and [Superpowers plan handoffs](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/writing-plans/SKILL.md) (new review on 2026-10-01; the original inspiration revision is unknown). They retain this package's local artifacts and explicit target selection rather than importing upstream task indexes, fixed models, or publication workflows.

Evaluation, outcome accounting, and resume improvements were informed by [Agent Skills evaluation guidance](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/evaluating-skills.mdx), [description evaluation](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/optimizing-descriptions.mdx), [Anthropic's claim grading](https://github.com/anthropics/skills/blob/8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4/skills/skill-creator/agents/grader.md), [Spec Kit coverage](https://github.com/github/spec-kit/blob/d2ddd910266ad14afe79c5414c88ee316aca6e9a/templates/commands/analyze.md), [GSD resume](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/get-shit-done/workflows/resume-project.md), and [Superpowers execution records](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/executing-plans/SKILL.md), reviewed on 2026-10-01. These are design references, not runtime dependencies.

See the [Agent Skills specification](https://agentskills.io/specification), [portable Agent Plugins specification](https://agent-plugins.org/specification), and each host's native installation documentation. The template's MIT notice is retained in LICENSE; upstream workflow collections are design references rather than copied dependencies.
