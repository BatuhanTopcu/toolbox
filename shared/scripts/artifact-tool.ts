#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ReportError, validateReport } from "../html/contract.ts";

type Mode = "change" | "improve" | "research";
type Depth = "quick" | "standard" | "deep";
type JsonMap = Record<string, any>;

type Diagnostic = {
  code: string;
  path: string;
  message: string;
};

type ParsedDocument = {
  metadata: JsonMap;
  body: string;
  raw: string;
};

type TaskRecord = {
  id: string;
  file: string;
  absolutePath: string;
  document: ParsedDocument;
};

type ArtifactContext = {
  artifactDir: string;
  repositoryRoot: string;
  mode: Mode;
  slug: string;
  sourceName: string;
  sourcePath: string;
  source: ParsedDocument;
  tasks: TaskRecord[];
};

type ValidationResult = { ok: boolean; artifact: string; diagnostics: Diagnostic[] };
type ArtifactRow = {
  path: string;
  html_path: string;
  artifact: string;
  title: string;
  mode: Mode;
  status: string | null;
  updated_at: string | null;
  validation: { ok: boolean; diagnostics: Diagnostic[] };
  eligible: boolean;
  reasons: string[];
  task_counts: Record<string, number>;
};

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SHARED_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const TEMPLATE_ROOT = path.join(SHARED_ROOT, "assets", "templates");
const REQUIRED_MARKER = "<!-- REQUIRED:";
const TOKEN_PATTERN = /\{\{[A-Z0-9_]+\}\}/;
const MODE_DOCUMENTS = {
  change: { source: "ANALYSIS.md", type: "analysis", template: "analysis.md" },
  improve: { source: "IMPROVEMENT.md", type: "improvement", template: "improvement.md" },
  research: { source: "RESEARCH.md", type: "research", template: "research.md" },
};
const MODES = new Set(Object.keys(MODE_DOCUMENTS));
const DEPTHS = new Set(["quick", "standard", "deep"]);
const DOCUMENT_STATUSES = new Set(["draft", "ready", "superseded"]);
const TASK_STATUSES = new Set([
  "todo",
  "in-progress",
  "blocked",
  "done",
  "wont-do",
]);
const LEGACY_FILES = new Set([
  "README.md",
  "RESEARCH_LOG.md",
  "tasks/README.md",
  "tasks/PROMPT.md",
]);

class ToolError extends Error {
  code: string;
  targetPath: string;

  constructor(code: string, message: string, targetPath = "") {
    super(message);
    this.name = "ToolError";
    this.code = code;
    this.targetPath = targetPath;
  }
}

function assertRuntime(): void {
  if (
    typeof Bun === "undefined" ||
    typeof Bun.YAML?.parse !== "function" ||
    typeof Bun.YAML?.stringify !== "function" ||
    typeof Bun.markdown?.render !== "function"
  ) {
    throw new ToolError(
      "UNSUPPORTED_BUN",
      "Bun with YAML parse/stringify and Markdown render support is required.",
    );
  }
}

function usage(): string {
  return [
    "Analyse artifact tool",
    "",
    "Usage:",
    "  bun shared/scripts/artifact-tool.ts init --repo <path> --mode <change|improve|research> --name <slug> [--depth <quick|standard|deep>]",
    "  bun shared/scripts/artifact-tool.ts add-task <artifact-dir> --title <title>",
    "  bun shared/scripts/artifact-tool.ts validate <artifact-dir> [--content-only] [--json]",
    "  bun shared/scripts/artifact-tool.ts list --repo <path> [--json]",
    "  bun shared/scripts/artifact-tool.ts --help",
    "",
    "init creates a draft main MD. Render its HTML sibling before whole-artifact validation.",
    "--content-only checks MD/tasks and does not establish paired readiness. add-task creates tasks/ lazily.",
  ].join("\n");
}

function parseArguments(args: string[]): {
  command: string;
  positionals: string[];
  options: Map<string, string | true>;
} {
  const command = args[0] ?? "";
  const positionals: string[] = [];
  const options = new Map<string, string | true>();

  for (let index = 1; index < args.length; index += 1) {
    const item = args[index];
    if (!item.startsWith("--")) {
      positionals.push(item);
      continue;
    }

    const name = item.slice(2);
    if (name === "json" || name === "content-only") {
      options.set(name, true);
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new ToolError("CLI_USAGE", `Missing value for --${name}.`);
    }
    options.set(name, value);
    index += 1;
  }

  return { command, positionals, options };
}

function optionString(
  options: Map<string, string | true>,
  name: string,
  required = false,
): string | undefined {
  const value = options.get(name);
  if (typeof value === "string" && value.trim() !== "") return value;
  if (required) throw new ToolError("CLI_USAGE", `Missing required option --${name}.`);
  return undefined;
}

function isRecord(value: unknown): value is JsonMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(target: string): Promise<void> {
  let details;
  try {
    details = await stat(target);
  } catch {
    throw new ToolError("PATH_MISSING", "Directory does not exist.", target);
  }
  if (!details.isDirectory()) {
    throw new ToolError("PATH_NOT_DIRECTORY", "Expected a directory.", target);
  }
}

function withinRoot(target: string, root: string): boolean {
  const relative = path.relative(root, target);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function assertRepositoryPath(target: string, repositoryRoot: string): Promise<void> {
  const root = path.resolve(repositoryRoot);
  const resolved = path.resolve(target);
  if (!withinRoot(resolved, root)) {
    throw new ToolError("PATH_ESCAPE", "Artifact path escapes the selected repository.", target);
  }
  const physicalRoot = await realpath(root);
  let existing = resolved;
  while (true) {
    try {
      await lstat(existing);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new ToolError("PATH_UNREADABLE", "Could not inspect artifact path.", existing);
      }
      existing = path.dirname(existing);
    }
  }
  let physicalPath: string;
  try {
    physicalPath = await realpath(existing);
  } catch {
    throw new ToolError("PATH_UNREADABLE", "Could not resolve artifact path.", existing);
  }
  if (!withinRoot(physicalPath, physicalRoot)) {
    throw new ToolError("PATH_ESCAPE", "Artifact symlink escapes the selected repository.", target);
  }
}

async function writeAtomic(target: string, content: string, repositoryRoot: string): Promise<void> {
  await assertRepositoryPath(target, repositoryRoot);
  const temporary = `${target}.tmp-${process.pid}-${createHash("sha1")
    .update(target)
    .digest("hex")
    .slice(0, 8)}`;
  await writeFile(temporary, content, { encoding: "utf8", flag: "wx" });
  await rename(temporary, target);
}

async function readTemplate(name: string): Promise<string> {
  const target = path.join(TEMPLATE_ROOT, name);
  try {
    return await readFile(target, "utf8");
  } catch {
    throw new ToolError("TEMPLATE_MISSING", "Required template is missing.", target);
  }
}

function render(template: string, values: Record<string, string>): string {
  const rendered = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, name) => {
    if (!(name in values)) {
      throw new ToolError("TEMPLATE_VALUE_MISSING", `Missing template value ${name}.`);
    }
    return values[name];
  });
  if (TOKEN_PATTERN.test(rendered)) {
    throw new ToolError("TEMPLATE_UNRESOLVED", "Template contains unresolved values.");
  }
  return rendered.endsWith("\n") ? rendered : `${rendered}\n`;
}

function yamlStringify(value: JsonMap): string {
  return Bun.YAML.stringify(value).trimEnd();
}

function frontmatterText(metadata: JsonMap): string {
  return `---\n${yamlStringify(metadata)}\n---`;
}

function parseDocument(raw: string, target: string): ParsedDocument {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new ToolError("FRONTMATTER_MISSING", "YAML frontmatter is required.", target);
  }

  let metadata: unknown;
  try {
    metadata = Bun.YAML.parse(match[1]);
  } catch (error) {
    throw new ToolError(
      "FRONTMATTER_INVALID",
      `Could not parse YAML frontmatter: ${String(error)}`,
      target,
    );
  }
  if (!isRecord(metadata)) {
    throw new ToolError("FRONTMATTER_INVALID", "Frontmatter must be a mapping.", target);
  }

  return { metadata, body: raw.slice(match[0].length), raw };
}

export async function readDocument(target: string, repositoryRoot: string): Promise<ParsedDocument> {
  await assertRepositoryPath(target, repositoryRoot);
  try {
    return parseDocument(await readFile(target, "utf8"), target);
  } catch (error) {
    if (error instanceof ToolError) throw error;
    throw new ToolError("DOCUMENT_MISSING", "Required document is missing.", target);
  }
}

async function updateFrontmatter(
  target: string,
  document: ParsedDocument,
  metadata: JsonMap,
  repositoryRoot: string,
): Promise<void> {
  await writeAtomic(target, `${frontmatterText(metadata)}\n${document.body}`, repositoryRoot);
}

function runGit(repo: string, args: string[]): { ok: boolean; output: string } {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return {
    ok: result.status === 0,
    output: typeof result.stdout === "string" ? result.stdout.trim() : "",
  };
}

function captureRevision(repo: string): { revision: string; dirty: boolean } {
  const revision = runGit(repo, ["rev-parse", "HEAD"]);
  const status = runGit(repo, ["status", "--porcelain"]);
  return { revision: revision.ok ? revision.output : "none", dirty: status.ok && status.output !== "" };
}

export function canonicalLocation(artifactDirInput: string): {
  artifactDir: string;
  repositoryRoot: string;
  mode: Mode;
  slug: string;
} {
  const artifactDir = path.resolve(artifactDirInput);
  const parts = artifactDir.split(path.sep);
  const marker = parts.lastIndexOf(".artifacts");

  if (
    marker < 1 ||
    parts[marker + 1] !== "analyse" ||
    !MODES.has(parts[marker + 2]) ||
    !parts[marker + 3] ||
    parts.length !== marker + 4
  ) {
    if (parts.includes("analyses") || parts.includes("improvements")) {
      throw new ToolError("LEGACY_SCHEMA", "Older analyse artifact layouts are unsupported.", artifactDir);
    }
    throw new ToolError(
      "ARTIFACT_PATH",
      "Artifact path must be .artifacts/analyse/<change|improve|research>/<slug>.",
      artifactDir,
    );
  }

  const slug = parts[marker + 3];
  if (slugify(slug) !== slug) {
    throw new ToolError("SLUG_INVALID", "Artifact slug must be lowercase kebab-case.", artifactDir);
  }

  return {
    artifactDir,
    repositoryRoot: parts.slice(0, marker).join(path.sep) || path.sep,
    mode: parts[marker + 2] as Mode,
    slug,
  };
}

async function listTasks(artifactDir: string, repositoryRoot: string): Promise<TaskRecord[]> {
  const tasksDir = path.join(artifactDir, "tasks");
  await assertRepositoryPath(tasksDir, repositoryRoot);
  if (!(await exists(tasksDir))) return [];
  await ensureDirectory(tasksDir);

  const entries = await readdir(tasksDir, { withFileTypes: true });
  if (entries.length === 0) {
    throw new ToolError(
      "TASK_DIRECTORY_EMPTY",
      "Remove the empty tasks directory; tasks are created only when requested.",
      tasksDir,
    );
  }

  const tasks: TaskRecord[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(tasksDir, entry.name);
    await assertRepositoryPath(absolutePath, repositoryRoot);
    const relative = `tasks/${entry.name}`;
    if (LEGACY_FILES.has(relative)) {
      throw new ToolError("LEGACY_SCHEMA", "Generated task indexes and prompts are unsupported.", relative);
    }
    const match = entry.name.match(/^(\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/);
    if (!entry.isFile() || !match) {
      throw new ToolError("ARTIFACT_EXTRA", "tasks/ may contain only numbered task Markdown files.", relative);
    }
    tasks.push({
      id: match[1],
      file: entry.name,
      absolutePath,
      document: await readDocument(absolutePath, repositoryRoot),
    });
  }
  return tasks;
}

async function loadArtifact(artifactDirInput: string): Promise<ArtifactContext> {
  const location = canonicalLocation(artifactDirInput);
  await assertRepositoryPath(location.artifactDir, location.repositoryRoot);
  await ensureDirectory(location.artifactDir);

  const sourceName = MODE_DOCUMENTS[location.mode].source;
  const htmlName = sourceName.replace(/\.md$/, ".html");
  const allowedRootEntries = new Set(location.mode === "research" ? [sourceName, htmlName] : [sourceName, htmlName, "tasks"]);
  for (const entry of await readdir(location.artifactDir, { withFileTypes: true })) {
    await assertRepositoryPath(path.join(location.artifactDir, entry.name), location.repositoryRoot);
    if (allowedRootEntries.has(entry.name)) continue;
    if (location.mode === "research" && entry.name === "tasks") {
      throw new ToolError("RESEARCH_TASKS_UNSUPPORTED", "Research artifacts cannot contain tasks.", location.artifactDir);
    }
    if (LEGACY_FILES.has(entry.name)) {
      throw new ToolError("LEGACY_SCHEMA", "Older generated analyse artifacts are unsupported.", entry.name);
    }
    throw new ToolError("ARTIFACT_EXTRA", "Unexpected file in compact analyse artifact.", entry.name);
  }

  const sourcePath = path.join(location.artifactDir, sourceName);
  return {
    ...location,
    sourceName,
    sourcePath,
    source: await readDocument(sourcePath, location.repositoryRoot),
    tasks: location.mode === "research" ? [] : await listTasks(location.artifactDir, location.repositoryRoot),
  };
}

function addDiagnostic(
  diagnostics: Diagnostic[],
  code: string,
  targetPath: string,
  message: string,
): void {
  diagnostics.push({ code, path: targetPath, message });
}

function validTimestamp(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function inspectBody(body: string): {
  title: string | undefined;
  sections: Array<{ heading: string; hasContent: boolean }>;
  unresolvedMarker: boolean;
} {
  let unresolvedMarker = false;
  const content = (text: string): string => text.trim() ? '{"content":true}\n' : "";
  // Render top-level blocks as records. Containers collapse their children so
  // headings inside quoted examples or lists cannot satisfy required sections.
  const blocks = Bun.markdown.render(body, {
    heading: (heading, { level }) => `${JSON.stringify({ heading: heading.trim(), level })}\n`,
    paragraph: content,
    code: content,
    blockquote: content,
    list: content,
    table: content,
    hr: () => "",
    html: (html) => {
      if (html.includes(REQUIRED_MARKER)) unresolvedMarker = true;
      return content(html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, ""));
    },
  });
  const sections: Array<{ heading: string; hasContent: boolean }> = [];
  let title: string | undefined;
  let current: (typeof sections)[number] | undefined;
  for (const line of blocks.split("\n").filter(Boolean)) {
    const block = JSON.parse(line) as { heading?: string; level?: number; content?: boolean };
    if (block.level === 1 || block.level === 2) {
      if (block.level === 1 && title === undefined) title = block.heading;
      current = block.level === 2 ? { heading: block.heading!, hasContent: false } : undefined;
      if (current) sections.push(current);
    } else if (block.content && current) {
      current.hasContent = true;
    }
  }
  return { title, sections, unresolvedMarker };
}

function validateBody(
  document: ParsedDocument,
  template: string,
  targetPath: string,
  diagnostics: Diagnostic[],
): void {
  const body = inspectBody(document.body);
  if (body.unresolvedMarker) {
    addDiagnostic(diagnostics, "UNRESOLVED_MARKER", targetPath, "Complete every required scaffold comment.");
  }
  for (const { heading } of inspectBody(template).sections) {
    const matches = body.sections.filter((section) => section.heading === heading);
    if (matches.length === 0) {
      addDiagnostic(diagnostics, "SECTION_MISSING", targetPath, `Required section "${heading}" is missing.`);
    } else if (matches.some((section) => !section.hasContent)) {
      addDiagnostic(diagnostics, "SECTION_EMPTY", targetPath, `Required section "${heading}" needs authored content.`);
    }
  }
}

function validateDocumentMetadata(
  context: ArtifactContext,
  diagnostics: Diagnostic[],
): void {
  const metadata = context.source.metadata;
  const source = context.sourceName;
  const expectedType = MODE_DOCUMENTS[context.mode].type;

  if (metadata.schema_version !== 3) {
    addDiagnostic(diagnostics, "SCHEMA_VERSION", source, "schema_version must equal 3; older artifacts are unsupported.");
  }
  if (metadata.document_type !== expectedType || metadata.mode !== context.mode) {
    addDiagnostic(diagnostics, "DOCUMENT_MODE", source, "document_type and mode must match the path.");
  }
  if (metadata.slug !== context.slug) {
    addDiagnostic(diagnostics, "SLUG_MISMATCH", source, "slug must match the artifact directory.");
  }
  if (!DEPTHS.has(metadata.depth)) {
    addDiagnostic(diagnostics, "DEPTH_INVALID", source, "depth must be quick, standard, or deep.");
  }
  if (!DOCUMENT_STATUSES.has(metadata.status)) {
    addDiagnostic(diagnostics, "DOCUMENT_STATUS", source, "status is invalid.");
  } else if (metadata.status !== "ready") {
    addDiagnostic(diagnostics, "DOCUMENT_NOT_READY", source, "Set status to ready after authoring is complete.");
  }

  const repository = metadata.repository;
  if (!isRecord(repository) || path.resolve(String(repository.root ?? "")) !== context.repositoryRoot) {
    addDiagnostic(diagnostics, "REPOSITORY_INVALID", source, "repository.root must match the target repository.");
  } else if (
    typeof repository.revision !== "string" ||
    typeof repository.dirty !== "boolean"
  ) {
    addDiagnostic(diagnostics, "REVISION_INVALID", source, "repository revision and dirty state are required.");
  }
  if (!validTimestamp(metadata.created_at) || !validTimestamp(metadata.updated_at)) {
    addDiagnostic(diagnostics, "TIMESTAMP_INVALID", source, "created_at and updated_at must be timestamps.");
  }
}

function validateTasks(context: ArtifactContext, diagnostics: Diagnostic[]): void {
  const byId = new Map(context.tasks.map((task) => [task.id, task]));
  if (byId.size !== context.tasks.length) {
    addDiagnostic(diagnostics, "TASK_ID_DUPLICATE", "tasks", "Task IDs must be unique.");
  }

  for (const task of context.tasks) {
    const metadata = task.document.metadata;
    const relative = `tasks/${task.file}`;
    if (metadata.schema_version !== 3 || metadata.document_type !== "task") {
      addDiagnostic(diagnostics, "TASK_SCHEMA", relative, "Task schema_version must be 3 and document_type task.");
    }
    if (String(metadata.id ?? "") !== task.id) {
      addDiagnostic(diagnostics, "TASK_ID_MISMATCH", relative, "Task id must match its filename.");
    }
    if (typeof metadata.title !== "string" || metadata.title.trim() === "") {
      addDiagnostic(diagnostics, "TASK_TITLE", relative, "Task title is required.");
    }
    if (metadata.source !== context.sourceName) {
      addDiagnostic(diagnostics, "TASK_SOURCE", relative, `Task source must be ${context.sourceName}.`);
    }
    if (!TASK_STATUSES.has(metadata.status)) {
      addDiagnostic(diagnostics, "TASK_STATUS", relative, "Task status is invalid.");
    }
    if (!validTimestamp(metadata.created_at) || !validTimestamp(metadata.updated_at)) {
      addDiagnostic(diagnostics, "TIMESTAMP_INVALID", relative, "created_at and updated_at must be timestamps.");
    }
    if (!Array.isArray(metadata.depends_on)) {
      addDiagnostic(diagnostics, "DEPENDENCY_INVALID", relative, "depends_on must be an array of task IDs.");
    } else {
      const dependencies = metadata.depends_on.map(String);
      if (
        dependencies.some((id: string) => !/^\d{3}$/.test(id)) ||
        new Set(dependencies).size !== dependencies.length ||
        dependencies.includes(task.id)
      ) {
        addDiagnostic(diagnostics, "DEPENDENCY_INVALID", relative, "Dependencies must be unique three-digit IDs other than the task itself.");
      }
      for (const dependency of dependencies) {
        if (!byId.has(dependency)) {
          addDiagnostic(diagnostics, "DEPENDENCY_MISSING", relative, `Dependency ${dependency} does not exist.`);
        }
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    const task = byId.get(id);
    const dependencies = Array.isArray(task?.document.metadata.depends_on)
      ? task!.document.metadata.depends_on.map(String).filter((value: string) => byId.has(value))
      : [];
    for (const dependency of dependencies) {
      if (!visit(dependency)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  };

  for (const id of byId.keys()) {
    if (!visit(id)) {
      addDiagnostic(diagnostics, "DEPENDENCY_CYCLE", "tasks", "Task dependencies must be acyclic.");
      break;
    }
  }
}

export async function validateArtifact(artifactDir: string, includeHtml = true): Promise<ValidationResult> {
  const diagnostics: Diagnostic[] = [];
  let context: ArtifactContext;
  let sourceTemplate: string;
  let taskTemplate: string | undefined;
  try {
    context = await loadArtifact(artifactDir);
    sourceTemplate = await readTemplate(MODE_DOCUMENTS[context.mode].template);
    if (context.tasks.length > 0) taskTemplate = await readTemplate("task.md");
  } catch (error) {
    const known = error instanceof ToolError
      ? error
      : new ToolError("ARTIFACT_INVALID", String(error), artifactDir);
    return {
      ok: false,
      artifact: path.resolve(artifactDir),
      diagnostics: [{
        code: known.code,
        path: known.targetPath || artifactDir,
        message: known.message,
      }],
    };
  }

  validateDocumentMetadata(context, diagnostics);
  validateBody(context.source, sourceTemplate, context.sourceName, diagnostics);
  validateTasks(context, diagnostics);
  for (const task of context.tasks) {
    validateBody(task.document, taskTemplate!, `tasks/${task.file}`, diagnostics);
  }
  if (includeHtml && context.source.metadata.schema_version === 3) {
    const htmlName = context.sourceName.replace(/\.md$/, ".html");
    try {
      await assertRepositoryPath(path.join(context.artifactDir, htmlName), context.repositoryRoot);
      await validateReport(path.join(context.artifactDir, htmlName), context.source);
    } catch (error) {
      addDiagnostic(diagnostics, error instanceof ReportError ? error.code : error instanceof ToolError ? error.code : "HTML_MISSING",
        htmlName, error instanceof Error ? error.message : "Could not validate HTML companion.");
    }
  }
  diagnostics.sort((left, right) => {
    const byPath = left.path.localeCompare(right.path);
    return byPath !== 0 ? byPath : left.code.localeCompare(right.code);
  });
  return { ok: diagnostics.length === 0, artifact: context.artifactDir, diagnostics };
}

function diagnosticFromError(error: unknown, target: string): Diagnostic {
  return error instanceof ToolError
    ? { code: error.code, path: error.targetPath || target, message: error.message }
    : { code: "ARTIFACT_UNREADABLE", path: target, message: "Could not read artifact." };
}

async function inventory(options: Map<string, string | true>): Promise<{
  artifacts: ArtifactRow[];
  diagnostics: Diagnostic[];
}> {
  const repo = path.resolve(optionString(options, "repo", true)!);
  try {
    await ensureDirectory(repo);
    await readdir(repo);
  } catch {
    throw new ToolError("REPOSITORY_UNREADABLE", "Repository directory is missing or unreadable.", repo);
  }

  const artifacts: ArtifactRow[] = [];
  const diagnostics: Diagnostic[] = [];
  const root = path.join(repo, ".artifacts", "analyse");
  let modes;
  try {
    await assertRepositoryPath(root, repo);
    modes = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") diagnostics.push(diagnosticFromError(error, root));
    return { artifacts, diagnostics };
  }

  for (const directory of modes.sort((left, right) => left.name.localeCompare(right.name))) {
    const modePath = path.join(root, directory.name);
    if (!MODES.has(directory.name)) {
      diagnostics.push({ code: "ARTIFACT_PATH", path: modePath, message: "Unsupported artifact mode; no migration was attempted." });
      continue;
    }
    const mode = directory.name as Mode;
    let entries;
    try {
      await assertRepositoryPath(modePath, repo);
      entries = await readdir(modePath, { withFileTypes: true });
    } catch (error) {
      diagnostics.push(diagnosticFromError(error, modePath));
      continue;
    }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const artifact = path.join(modePath, entry.name);
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        diagnostics.push({ code: "ARTIFACT_PATH", path: artifact, message: "Expected an artifact directory." });
        continue;
      }
      const sourcePath = path.join(artifact, MODE_DOCUMENTS[mode].source);
      const result = await validateArtifact(artifact);
      const validation = {
        ok: result.ok,
        diagnostics: result.diagnostics.map((item) => ({ ...item, path: path.resolve(artifact, item.path) })),
      };
      let title = titleFromSlug(entry.name);
      let status: string | null = null;
      let updated_at: string | null = null;
      const task_counts = Object.fromEntries([...TASK_STATUSES].map((item) => [item, 0]));
      try {
        const source = await readDocument(sourcePath, repo);
        title = inspectBody(source.body).title?.replace(/^(?:Analysis|Improvement Audit|Research):\s*/, "") || title;
        status = typeof source.metadata.status === "string" ? source.metadata.status : null;
        updated_at = typeof source.metadata.updated_at === "string" ? source.metadata.updated_at : null;
        if (mode !== "research") {
          for (const task of await listTasks(artifact, repo)) {
            const taskStatus = task.document.metadata.status;
            if (TASK_STATUSES.has(taskStatus)) task_counts[taskStatus] += 1;
          }
        }
      } catch (error) {
        const diagnostic = diagnosticFromError(error, artifact);
        diagnostic.path = path.resolve(artifact, diagnostic.path);
        if (!validation.diagnostics.some((item) => item.code === diagnostic.code && item.path === diagnostic.path)) {
          validation.diagnostics.push(diagnostic);
        }
        validation.ok = false;
      }
      const reasons = validation.diagnostics.map((item) => `${item.code}: ${item.message}`);
      if (status === "draft") reasons.push("Draft authoring is incomplete; select a ready artifact.");
      if (status === "superseded") reasons.push("Superseded artifacts are historical and cannot be implementation targets.");
      if (mode === "research") reasons.push("Research is supporting context, not an implementation target.");
      artifacts.push({
        path: sourcePath,
        html_path: sourcePath.replace(/\.md$/, ".html"),
        artifact,
        title,
        mode,
        status,
        updated_at,
        validation,
        eligible: validation.ok && status === "ready" && mode !== "research",
        reasons,
        task_counts,
      });
      diagnostics.push(...validation.diagnostics);
    }
  }
  return { artifacts, diagnostics };
}

function printInventory(result: { artifacts: ArtifactRow[]; diagnostics: Diagnostic[] }, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.artifacts.length === 0) console.log("No analysis artifacts found.");
  for (const artifact of result.artifacts) {
    console.log(`${artifact.eligible ? "CANDIDATE" : "INELIGIBLE"} ${artifact.title}`);
    console.log(`  ${artifact.path}`);
    console.log(`  mode=${artifact.mode} status=${artifact.status ?? "unknown"} updated=${artifact.updated_at ?? "unknown"} validation=${artifact.validation.ok ? "valid" : "invalid"}`);
    console.log(`  tasks=${JSON.stringify(artifact.task_counts)}`);
    for (const reason of artifact.reasons) console.log(`  ${reason}`);
  }
  for (const diagnostic of result.diagnostics) {
    console.error(`ERROR [${diagnostic.code}] ${diagnostic.path}: ${diagnostic.message}`);
  }
}

async function initialize(options: Map<string, string | true>): Promise<string> {
  const repo = path.resolve(optionString(options, "repo", true)!);
  const modeValue = optionString(options, "mode", true)!;
  const nameValue = optionString(options, "name", true)!;
  const depthValue = optionString(options, "depth") ?? "standard";

  await ensureDirectory(repo);
  if (!MODES.has(modeValue)) {
    throw new ToolError("MODE_INVALID", "--mode must be change, improve, or research.");
  }
  if (!DEPTHS.has(depthValue)) {
    throw new ToolError("DEPTH_INVALID", "--depth must be quick, standard, or deep.");
  }

  const mode = modeValue as Mode;
  const depth = depthValue as Depth;
  const slug = slugify(nameValue);
  if (!slug) throw new ToolError("SLUG_INVALID", "Name must produce a non-empty slug.");

  const artifactDir = path.join(repo, ".artifacts", "analyse", mode, slug);
  await assertRepositoryPath(artifactDir, repo);
  if (await exists(artifactDir)) {
    throw new ToolError("ARTIFACT_EXISTS", "Artifact exists; reconcile it or choose another slug.", artifactDir);
  }

  await mkdir(artifactDir, { recursive: true });
  const now = new Date().toISOString();
  const sourceName = MODE_DOCUMENTS[mode].source;
  const metadata: JsonMap = {
    schema_version: 3,
    document_type: MODE_DOCUMENTS[mode].type,
    mode,
    slug,
    status: "draft",
    depth,
    repository: { root: repo, ...captureRevision(repo) },
    created_at: now,
    updated_at: now,
  };
  const template = await readTemplate(MODE_DOCUMENTS[mode].template);
  await writeAtomic(
    path.join(artifactDir, sourceName),
    render(template, {
      FRONTMATTER: frontmatterText(metadata),
      TITLE: titleFromSlug(slug),
    }),
    repo,
  );
  return artifactDir;
}

async function addTask(
  artifactDir: string,
  options: Map<string, string | true>,
): Promise<string> {
  const title = optionString(options, "title", true)!;
  const context = await loadArtifact(artifactDir);
  if (context.mode === "research") {
    throw new ToolError("RESEARCH_TASKS_UNSUPPORTED", "Research artifacts do not support tasks.", context.sourcePath);
  }
  if (context.source.metadata.schema_version !== 3) {
    throw new ToolError("LEGACY_SCHEMA", "Only schema-version-3 artifacts support tasks.", context.sourcePath);
  }

  const next = context.tasks.reduce((value, task) => Math.max(value, Number(task.id)), 0) + 1;
  if (next > 999) throw new ToolError("TASK_ID_EXHAUSTED", "Task IDs cannot exceed 999.");
  const id = String(next).padStart(3, "0");
  const taskSlug = slugify(title);
  if (!taskSlug) throw new ToolError("SLUG_INVALID", "Task title must produce a non-empty slug.");

  const tasksDir = path.join(context.artifactDir, "tasks");
  await mkdir(tasksDir, { recursive: true });
  const target = path.join(tasksDir, `${id}-${taskSlug}.md`);
  const now = new Date().toISOString();
  const metadata: JsonMap = {
    schema_version: 3,
    document_type: "task",
    id,
    title,
    source: context.sourceName,
    status: "todo",
    depends_on: [],
    created_at: now,
    updated_at: now,
  };
  await writeAtomic(
    target,
    render(await readTemplate("task.md"), {
      FRONTMATTER: frontmatterText(metadata),
      TASK_ID: id,
      TITLE: title,
    }),
    context.repositoryRoot,
  );
  await updateFrontmatter(context.sourcePath, context.source, {
    ...context.source.metadata,
    updated_at: now,
  }, context.repositoryRoot);
  return target;
}

function printValidation(
  result: { ok: boolean; artifact: string; diagnostics: Diagnostic[] },
  json: boolean,
): void {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.ok) {
    console.log(`VALID ${result.artifact}`);
    return;
  }
  for (const diagnostic of result.diagnostics) {
    console.error(`ERROR [${diagnostic.code}] ${diagnostic.path}: ${diagnostic.message}`);
  }
  console.error(`INVALID ${result.artifact} (${result.diagnostics.length} error(s))`);
}

async function main(): Promise<void> {
  assertRuntime();
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(usage());
    return;
  }

  const parsed = parseArguments(args);
  if (parsed.command === "init") {
    if (parsed.positionals.length !== 0) {
      throw new ToolError("CLI_USAGE", "init does not accept positional arguments.");
    }
    console.log(await initialize(parsed.options));
    return;
  }
  if (parsed.command === "add-task") {
    if (parsed.positionals.length !== 1) {
      throw new ToolError("CLI_USAGE", "add-task requires one artifact directory.");
    }
    console.log(await addTask(parsed.positionals[0], parsed.options));
    return;
  }
  if (parsed.command === "validate") {
    if (parsed.positionals.length !== 1) {
      throw new ToolError("CLI_USAGE", "validate requires one artifact directory.");
    }
    const contentOnly = parsed.options.has("content-only");
    const result = await validateArtifact(parsed.positionals[0], !contentOnly);
    if (contentOnly && !parsed.options.has("json")) console.log("CONTENT ONLY: HTML freshness/readiness is not checked.");
    printValidation(contentOnly ? { ...result, content_only: true } : result, parsed.options.has("json"));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (parsed.command === "list") {
    if (parsed.positionals.length !== 0) {
      throw new ToolError("CLI_USAGE", "list does not accept positional arguments.");
    }
    printInventory(await inventory(parsed.options), parsed.options.has("json"));
    return;
  }
  throw new ToolError("CLI_USAGE", `Unknown command ${parsed.command}.\n\n${usage()}`);
}

if (import.meta.main) main().catch((error) => {
  const known = error instanceof ToolError
    ? error
    : new ToolError("UNEXPECTED", String(error));
  console.error(`ERROR [${known.code}]${known.targetPath ? ` ${known.targetPath}:` : ""} ${known.message}`);
  process.exitCode = 1;
});
