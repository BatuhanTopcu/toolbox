import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";

export const SECTION_IDS = ["summary", "context", "findings", "direction", "limits", "sources"] as const;
export const REPORT_FILES = { change: "ANALYSIS", plan: "PLAN", improve: "IMPROVEMENT", research: "RESEARCH", explain: "EXPLANATION" } as const;
export type ReportKind = keyof typeof REPORT_FILES;
export type ReportMetadata = {
  schema_version: 3;
  kind: ReportKind;
  slug: string;
  title: string;
  intent: string;
  depth: "quick" | "standard" | "deep";
  created_at: string;
  updated_at: string;
  repository?: { root: string; revision: string; dirty: boolean };
  source_sha256?: string;
};

export class ReportError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export const digest = (source: string | Uint8Array) => createHash("sha256").update(source).digest("hex");
export const escapeHTML = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function reportLocation(output: string) {
  const target = path.resolve(output);
  const parts = target.split(path.sep);
  const marker = parts.lastIndexOf(".artifacts");
  const explain = parts[marker + 1] === "explain";
  const kind = (explain ? "explain" : parts[marker + 2]) as ReportKind;
  const slug = parts[marker + (explain ? 2 : 3)];
  if (marker < 1 || (!explain && parts[marker + 1] !== "analyse") ||
      !Object.hasOwn(REPORT_FILES, kind) || (!explain && kind === "explain") ||
      !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      parts.length !== marker + (explain ? 4 : 5) || parts.at(-1) !== `${REPORT_FILES[kind]}.html`) {
    throw new ReportError("HTML_PATH", "Use the canonical main HTML sibling or .artifacts/explain/<slug>/EXPLANATION.html.");
  }
  return { target, directory: path.dirname(target), repositoryRoot: parts.slice(0, marker).join(path.sep) || path.sep, kind, slug };
}

export async function assertRegularFile(file: string, maximum: number) {
  const info = await lstat(file);
  if (!info.isFile() || info.size > maximum) throw new ReportError("HTML_FILE", "Expected a regular file within the size limit.");
}

export async function readReport(file: string): Promise<ReportMetadata> {
  await assertRegularFile(file, 64 * 1024 * 1024);
  const html = await readFile(file, "utf8");
  if (Buffer.byteLength(html) > 64 * 1024 * 1024) throw new ReportError("HTML_FILE", "Report exceeds 64 MiB.");
  let json = "";
  let metadataCount = 0;
  let mainCount = 0;
  const charts: { svg: number }[] = [];
  const activeCharts: { svg: number }[] = [];
  const sections = new Map(SECTION_IDS.map(id => [id, { count: 0, text: "" }]));
  const parser = new HTMLRewriter()
    .on('script#toolbox-report-metadata[type="application/json"]', { element() { metadataCount++; }, text(chunk) { json += chunk.text; } })
    .on('main[data-slot="reader-report"]', { element() { mainCount++; } })
    .on('main [data-slot="chart"]', { element(element) {
      const chart = { svg: 0 }; charts.push(chart); activeCharts.push(chart);
      element.onEndTag(() => { activeCharts.pop(); });
    } })
    .on('main [data-slot="chart"] svg.recharts-surface', { element() { const chart = activeCharts.at(-1); if (chart) chart.svg++; } });
  for (const [id, record] of sections) {
    parser.on(`main[data-slot="reader-report"] section#${id}[data-report-section]`, { element() { record.count++; } });
    parser.on(`main[data-slot="reader-report"] section#${id} [data-slot="section-content"]`, { text(chunk) { record.text += chunk.text; } });
  }
  await parser.transform(new Response(html)).text();
  if (metadataCount !== 1 || mainCount !== 1 || [...sections.values()].some(s => s.count !== 1 || !s.text.trim())) {
    throw new ReportError("HTML_STRUCTURE", "Report needs embedded metadata and six authored server-rendered sections.");
  }
  if (charts.some(chart => chart.svg === 0)) throw new ReportError("HTML_CHART", "Every chart must include its server-rendered SVG; supply initial dimensions.");
  if ([...sections.values()].some(s => /\{\{[A-Z0-9_]+\}\}|<!-- REQUIRED:/.test(s.text))) {
    throw new ReportError("HTML_UNRESOLVED", "Complete the reader template before rendering.");
  }
  let metadata: ReportMetadata;
  try { metadata = JSON.parse(json); } catch { throw new ReportError("HTML_METADATA", "Invalid report metadata."); }
  if (!metadata || metadata.schema_version !== 3 || !Object.hasOwn(REPORT_FILES, metadata.kind) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug) ||
      typeof metadata.title !== "string" || !metadata.title.trim() ||
      typeof metadata.intent !== "string" || !metadata.intent.trim() ||
      !["quick", "standard", "deep"].includes(metadata.depth) ||
      [metadata.created_at, metadata.updated_at].some(t => typeof t !== "string" || Number.isNaN(Date.parse(t))) ||
      (metadata.repository !== undefined && (!metadata.repository || typeof metadata.repository.root !== "string" || typeof metadata.repository.revision !== "string" || typeof metadata.repository.dirty !== "boolean"))) {
    throw new ReportError("HTML_METADATA", "Report metadata must describe the current schema, intent, scope, depth, and timestamps.");
  }
  return metadata;
}

export async function validateReport(file: string, source?: { raw: string; metadata: Record<string, any> }): Promise<ReportMetadata> {
  const location = reportLocation(file);
  const root = await realpath(location.repositoryRoot);
  const physical = await realpath(file);
  const relative = path.relative(root, physical);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new ReportError("PATH_ESCAPE", "HTML escapes the selected repository.");
  const metadata = await readReport(file);
  if (metadata.kind !== location.kind || metadata.slug !== location.slug) throw new ReportError("HTML_METADATA", "Report kind/slug must match its path.");
  if (source) {
    const md = source.metadata;
    if (metadata.source_sha256 !== digest(source.raw)) throw new ReportError("HTML_STALE", "HTML is stale; render from the final Markdown bytes.");
    if (metadata.depth !== md.depth || metadata.created_at !== md.created_at || metadata.updated_at !== md.updated_at ||
        metadata.repository?.root !== md.repository?.root || metadata.repository?.revision !== md.repository?.revision ||
        metadata.repository?.dirty !== md.repository?.dirty) throw new ReportError("HTML_METADATA", "HTML metadata must match its Markdown source.");
  } else if (location.kind !== "explain") {
    throw new ReportError("HTML_SOURCE", "Paired HTML needs its Markdown source for validation.");
  } else {
    const entries = await readdir(location.directory);
    if (entries.length !== 1 || entries[0] !== "EXPLANATION.html") throw new ReportError("ARTIFACT_EXTRA", "An explanation contains only EXPLANATION.html.");
    if (metadata.source_sha256 !== undefined) throw new ReportError("HTML_SOURCE", "Explanations have no Markdown source.");
  }
  return metadata;
}
