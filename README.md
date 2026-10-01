# Analysis agent plugin

Research a technical question, analyse a proposed change, audit a repository, and implement selected outcomes with evidence saved alongside the project. Four skills share one artifact workflow and common references.

## Install from GitHub

Choose your client below. These instructions install from [BatuhanTopcu/analysis-agent-plugin](https://github.com/BatuhanTopcu/analysis-agent-plugin); no contributor setup is needed. The published `main` branch currently contains development version **0.0.1**. There is no release tag yet.

Have your client and Git installed, then install [Bun](https://bun.sh/docs/installation) **1.4.0 or newer** and make it available on the agent's PATH. Bun runs the artifact helper; 1.4.0 is verified. Check it with:

```sh
bun --version
```

Choose [Codex](#codex), [Claude Code](#claude-code), [Cursor](#cursor), [pi](#pi), or [OpenCode V2](#opencode-v2). Install the complete package: the skills need the sibling `shared/` directory, so copying individual skills or using a sparse checkout breaks their references.

### Codex

Run in your terminal:

```sh
codex plugin marketplace add https://github.com/BatuhanTopcu/analysis-agent-plugin.git --ref main
codex plugin add analysis-agent-plugin@analysis-agent-plugin-marketplace
```

Open a new Codex session in the repository you want to work on. Confirm that `analyse`, `research`, `improve`, and `implement` are available, then try:

```text
$research explain how this repository handles failed requests
```

The install commands were checked against Codex CLI 0.159.0. If your CLI has no `plugin` command, update the client first.

### Claude Code

Run in your terminal to install for your user across projects:

```sh
claude plugin marketplace add BatuhanTopcu/analysis-agent-plugin --scope user
claude plugin install analysis-agent-plugin@analysis-agent-plugin-marketplace --scope user
```

Start Claude Code in your target repository, or enter `/reload-plugins` in an existing session. Confirm the four namespaced skills, then try:

```text
/analysis-agent-plugin:research explain how this repository handles failed requests
```

See [Claude Code's installation guide](https://code.claude.com/docs/en/plugins/install) for installation scopes and plugin management.

### Cursor

For Cursor's direct GitHub import, enter this in Agent chat:

```text
/add-plugin https://github.com/BatuhanTopcu/analysis-agent-plugin
```

Open **Customize** and confirm the four skills are available. Invoke a skill from the chat's skill picker, or ask the agent to use `research` to explain how the repository handles failed requests.

Cursor support describes this command, but also reports that GitHub-only imports can remain pinned to their initial commit even after reinstalling. See the [support reply](https://forum.cursor.com/t/plugin-update-version-management-how-are-installed-plugins-updated/166454/8). For team distribution, use **Dashboard → Plugins & MCPs → Team Marketplaces → Add Marketplace → Import from Repo**, then install from Customize; this requires Teams or Enterprise. See [Cursor's plugin guide](https://cursor.com/docs/plugins). A complete local checkout for development is documented [below](#local-preview-and-contributing).

### pi

Run in your terminal:

```sh
pi install https://github.com/BatuhanTopcu/analysis-agent-plugin.git
```

Restart pi in your target repository, or enter `/reload`, then try:

```text
/skill:research explain how this repository handles failed requests
```

Pi installs the complete Git package and discovers its four skills through `pi.skills`. Use the Node/npm installation required by pi; this plugin has no runtime npm dependencies and needs no pnpm or build step for installation. See pi's [package guide](https://github.com/earendil-works/pi/blob/v0.74.1/packages/coding-agent/docs/packages.md) and [skill commands](https://github.com/earendil-works/pi/blob/v0.74.1/packages/coding-agent/docs/skills.md).

### OpenCode V2

OpenCode V2 loads native skills from configured directories. Clone the complete GitHub package into a persistent location:

```sh
mkdir -p "$HOME/.local/share"
git clone https://github.com/BatuhanTopcu/analysis-agent-plugin.git \
  "$HOME/.local/share/analysis-agent-plugin"
```

From the repository you want to work on, register its skills:

```sh
bun "$HOME/.local/share/analysis-agent-plugin/scripts/configure.mjs" \
  opencode --project "$PWD"
```

The command preserves existing JSON settings and merges one absolute skills path into `opencode.json`. If the project uses `opencode.jsonc`, it prints the entry to merge manually so comments remain intact. Keep the checkout at that location, restart OpenCode, and ask the agent to use `research` for your question.

OpenCode's remote skill sources are HTTP catalogs, so a GitHub repository URL cannot be used directly in the `skills` array. This checkout preserves the package's shared resources. See [OpenCode V2's skills guide](https://opencode.ai/v2/docs/skills#sources).

## Use the skills

Run the agent in the target repository. Artifacts are written there under `.artifacts/analyse/`.

| Skill | Use it for | Saved result |
| --- | --- | --- |
| `research` | A bounded technical question and primary-source conclusion | `.artifacts/analyse/research/<slug>/RESEARCH.md` |
| `analyse` | A proposed repository change and concrete recommendation | `.artifacts/analyse/change/<slug>/ANALYSIS.md` |
| `improve` | An evidence-backed repository improvement audit | `.artifacts/analyse/improve/<slug>/IMPROVEMENT.md` |
| `implement` | Execution of a selected analysis, audit finding, or task | Product changes and verification in the selected artifact |

A typical Codex workflow is:

```text
$research compare the installed SDK's streaming APIs against its documentation
$analyse assess moving this service to streaming responses using that research
$implement .artifacts/analyse/change/streaming-responses/ANALYSIS.md
```

For an audit, use `$improve audit the payment module for concrete reliability improvements`, then select the findings you want `$implement` to carry out. In Claude Code, replace `$analyse` with `/analysis-agent-plugin:analyse`; in pi, use `/skill:analyse`. The other skill names follow the same pattern.

If the analysis is absent from the conversation, invoke `implement` without a target. It lists available artifacts with their status and asks which artifact and scope to implement. It does not automatically select the latest artifact or execute every finding.

Analysis and audits create task files only when requested; research creates none. A document marked `ready` is authored and may already contain completed work. Implementation checks the current repository, records a disposition and actual evidence or proof limit for every selected outcome, and keeps the current slice and next action in the same record so another session can resume.

## Update an installation

For Codex, refresh the marketplace snapshot and reinstall from it:

```sh
codex plugin marketplace upgrade analysis-agent-plugin-marketplace
codex plugin add analysis-agent-plugin@analysis-agent-plugin-marketplace
```

Open a new session and confirm the skills. The second command installs the package again from the refreshed source; see the [Codex installation implementation](https://github.com/openai/codex/blob/444da310e108da16aaeb18fd790b0ac464f08aca/codex-rs/core-plugins/src/manager.rs#L2245).

For Claude Code, refresh the marketplace and installed plugin:

```sh
claude plugin marketplace update analysis-agent-plugin-marketplace
claude plugin update analysis-agent-plugin@analysis-agent-plugin-marketplace --scope user
```

Then restart Claude Code or enter `/reload-plugins`. Custom marketplaces do not enable auto-update by default. An unchanged manifest version can cause Claude's copied installation to skip an update even when Git has new commits. Local-directory previews load in place. See [Claude's update guide](https://code.claude.com/docs/en/plugins/install#keep-plugins-updated) and [version rules](https://code.claude.com/docs/en/plugins/loading#versions-and-updates).

For pi:

```sh
pi update https://github.com/BatuhanTopcu/analysis-agent-plugin.git
```

Then restart pi or enter `/reload`.

For OpenCode's checkout:

```sh
git -C "$HOME/.local/share/analysis-agent-plugin" pull --ff-only
```

Restart OpenCode after pulling. For Cursor, use your team marketplace's refresh controls; direct GitHub imports have the update limitation described [above](#cursor). Local Cursor checkouts can be pulled with Git and loaded with **Developer: Reload Window**.

## Artifact storage

To keep `.artifacts/` out of Git across repositories, optionally add it to [Git's global ignore file](https://git-scm.com/docs/gitignore). This command preserves existing rules and uses your configured file or Git's default location:

```sh
ignore_file="$(git config --global --path core.excludesFile || true)"
ignore_file="${ignore_file:-${XDG_CONFIG_HOME:-$HOME/.config}/git/ignore}"
mkdir -p "$(dirname "$ignore_file")"
touch "$ignore_file"
grep -qxF '.artifacts/' "$ignore_file" || printf '\n.artifacts/\n' >> "$ignore_file"
```

Git ignore rules do not affect files already tracked. Artifacts remain on disk for review and later implementation.

The skills normally run the artifact helper themselves. To inspect or create artifacts manually, replace `/absolute/path/analysis-agent-plugin` with the complete installed package path and run from your target repository:

```sh
bun /absolute/path/analysis-agent-plugin/shared/scripts/artifact-tool.ts list \
  --repo "$PWD" --json
bun /absolute/path/analysis-agent-plugin/shared/scripts/artifact-tool.ts init \
  --repo "$PWD" --mode change --name streaming-responses
bun /absolute/path/analysis-agent-plugin/shared/scripts/artifact-tool.ts validate \
  "$PWD/.artifacts/analyse/change/streaming-responses"
```

Modes are `change`, `improve`, and `research`. `add-task <artifact-dir> --title <title>` is reserved for explicitly requested change/audit tasks. Inventory includes invalid artifacts with reasons and creates no index or cache. Unsupported historical layouts are reported without migration.

## Local preview and contributing

Clone the repository when developing or previewing local changes:

```sh
git clone https://github.com/BatuhanTopcu/analysis-agent-plugin.git
cd analysis-agent-plugin
```

For a session-only Claude Code preview:

```sh
claude --plugin-dir "$PWD"
```

For a Codex preview, use `codex plugin marketplace add "$PWD"` as the marketplace source, then install `analysis-agent-plugin@analysis-agent-plugin-marketplace`. Use one source for that marketplace name at a time.

For Cursor, clone the complete repository into its local plugin directory:

```sh
mkdir -p "$HOME/.cursor/plugins/local"
git clone https://github.com/BatuhanTopcu/analysis-agent-plugin.git \
  "$HOME/.cursor/plugins/local/analysis-agent-plugin"
```

Restart Cursor or run **Developer: Reload Window**, then confirm the skills in Customize. Organization policy may require **Allow Local Plugin Imports**. External symlinks are skipped, and an installed marketplace plugin with the same name takes precedence. See [Cursor's local plugin instructions](https://cursor.com/docs/plugins#test-plugins-locally).

Authoring checks require **Node 24.15+**, **pnpm 10.33.0**, and **Bun 1.4.0+** on PATH. From the checkout:

```sh
pnpm install --frozen-lockfile
pnpm validate
```

Edit `plugin.json` for identity, `skills/` for entrypoints, and `shared/` for common resources. `pnpm validate` rebuilds native manifests and package metadata, then checks them. Commit generated files alongside their sources. `pnpm check` verifies freshness without rebuilding.

```text
skills/{analyse,research,improve,implement}/SKILL.md
shared/references/              Workflows and artifact contracts
shared/scripts/artifact-tool.ts Bun artifact commands
shared/assets/templates/       Main-document and opt-in task templates
scripts/                       Native registrations, checks, and evaluations
```

Publish the complete package, including hidden manifest directories, shared resources, lockfile, and LICENSE. Keep the current development version at `0.0.1`; create an immutable `v0.0.1` tag when making the first release. Bump `plugin.json` for subsequent releases so copied installations can detect updates. Keep entrypoints and shared resources from the same version together.

## Verification

The [GitHub Actions check](.github/workflows/check.yml) installs pinned Node, pnpm, and Bun versions and runs `pnpm check` on pushes and pull requests. Checks cover schema validity, generated registrations, local resource links, OpenCode configuration preservation, artifact fixtures, path escapes, and relocation of the complete package into a separate repository.

These checks establish package structure and helper behavior. Current native model behavior, implicit routing, outcome accounting, and resume compliance remain unverified: the latest Claude behavior runs were blocked by provider retries/authentication. Earlier pi and Claude sessions discovered all four skills, but discovery alone does not prove instruction compliance. Codex, Cursor, and OpenCode runtime behavior has not been tested for this derivative.

For reproducible behavior checks, follow the [evaluation guide](shared/references/evaluations.md). `pnpm evaluate` prepares fixtures without model calls; `pnpm evaluate --run` executes them in temporary repositories using session-only plugins. Mechanical assertions and source-backed review of consequential claims are separate checks. Keep the before-change package for comparisons and retain failed-run evidence.

## Provenance and license

The package derives from [agent-plugin-template](https://github.com/BatuhanTopcu/agent-plugin-template), retains its MIT notice in [LICENSE](LICENSE), and uses native skill discovery rather than a custom agent runtime.

The workflows use original wording informed by [Matt Pocock's research](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/engineering/research/SKILL.md), [implementation](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/engineering/implement/SKILL.md), [task slicing](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/engineering/to-tickets/SKILL.md), and [shared skill mechanics](https://github.com/mattpocock/skills/blob/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/productivity/writing-for-agents/SKILL-MECHANICS.md); [shadcn's audit](https://github.com/shadcn/improve/blob/cac56e1ebd3c279aa9153616cfeac7b174ab90f9/skills/improve/SKILL.md) and [execution loop](https://github.com/shadcn/improve/blob/cac56e1ebd3c279aa9153616cfeac7b174ab90f9/skills/improve/references/closing-the-loop.md); and [Superpowers plan handoffs](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/writing-plans/SKILL.md) (new review on 2026-10-01; the original inspiration revision is unknown). They retain this package's local artifacts and explicit target selection rather than importing upstream task indexes, fixed models, or publication workflows.

Evaluation, outcome accounting, and resume improvements were informed by [Agent Skills evaluation guidance](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/evaluating-skills.mdx), [description evaluation](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/optimizing-descriptions.mdx), [Anthropic's claim grading](https://github.com/anthropics/skills/blob/8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4/skills/skill-creator/agents/grader.md), [Spec Kit coverage](https://github.com/github/spec-kit/blob/d2ddd910266ad14afe79c5414c88ee316aca6e9a/templates/commands/analyze.md), [GSD resume](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/get-shit-done/workflows/resume-project.md), and [Superpowers execution records](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/executing-plans/SKILL.md), reviewed on 2026-10-01. These are design references, not runtime dependencies.

See the [Agent Skills specification](https://agentskills.io/specification), [portable Agent Plugins specification](https://agent-plugins.org/specification), and each host's native installation documentation. The template's MIT notice is retained in LICENSE; upstream workflow collections are design references rather than copied dependencies.
