import { link, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { assertRepositoryPath, readDocument, validateArtifact } from "../scripts/artifact-tool.ts";
import { digest, escapeHTML, readReport, reportLocation, REPORT_FILES, type ReportMetadata } from "./contract.ts";
import { validateSource } from "./source.ts";

const root = resolve(import.meta.dir, "../..");
const maximum = 64 * 1024 * 1024;

async function notices(inputs: string[]) {
  const folders = new Set([dirname(Bun.resolveSync("tailwindcss/package.json", root))]);
  for (const input of inputs) {
    const parts = resolve(input).split(sep);
    const marker = parts.lastIndexOf("node_modules");
    if (marker >= 0) folders.add(parts.slice(0, marker + (parts[marker + 1].startsWith("@") ? 3 : 2)).join(sep));
  }
  const collected = new Map<string, string>();
  for (const folder of folders) {
    const pkg = await Bun.file(join(folder, "package.json")).json();
    const name = `${pkg.name}@${pkg.version}`;
    const files = (await readdir(folder)).filter(file => /^(licen[sc]e|notice|copying)([._-].*)?$/i.test(file));
    collected.set(name, `${name}\n${(await Promise.all(files.map(file => readFile(join(folder, file), "utf8")))).join("\n") || pkg.license || "License not specified"}`);
  }
  collected.set("shadcn/ui", await readFile(join(import.meta.dir, "SHADCN-LICENSE"), "utf8"));
  return [...collected].sort(([a], [b]) => a.localeCompare(b)).map(([name, text]) => `${name}\n${text}`).join("\n\n---\n\n");
}

export async function buildReport(input: string, output: string, options: { title?: string; intent?: string; depth?: string } = {}, temporaryDirectories = new Set<string>()) {
  if (!isAbsolute(input) || !isAbsolute(output)) throw new Error("Use absolute paths.");
  const location = reportLocation(output);
  if (resolve(input) !== join(location.directory, ".report.tsx")) throw new Error("Author temporary TSX at <artifact-dir>/.report.tsx; it is removed after the build.");
  await assertRepositoryPath(input, location.repositoryRoot);
  await assertRepositoryPath(output, location.repositoryRoot);
  if (!(await lstat(input)).isFile()) throw new Error("The report source must be a regular file.");
  let directory: string | undefined;
  try {
    if ((await lstat(input)).size > 2 * 1024 * 1024) throw new Error("Report source exceeds 2 MiB.");
    const code = await readFile(input, "utf8");
    if (Buffer.byteLength(code) > 2 * 1024 * 1024) throw new Error("Report source exceeds 2 MiB.");
    validateSource(code);
    await rm(input); // Only this canonical, agent-authored scratch file is consumed.
    let source: Awaited<ReturnType<typeof readDocument>> | undefined;
    const sourcePath = join(location.directory, `${REPORT_FILES[location.kind]}.md`);
    let metadata: ReportMetadata;
    const existing = await lstat(output).catch(error => { if (error.code !== "ENOENT") throw error; return null; });
    if (existing && !existing.isFile()) throw new Error("Refuse to replace a non-regular output.");
    const previous = existing ? await readReport(output) : undefined;
    const previousDigest = existing ? digest(await readFile(output)) : undefined;
    const now = new Date().toISOString();
    if (location.kind !== "explain") {
      const validation = await validateArtifact(location.directory, false);
      if (!validation.ok) throw new Error(JSON.stringify(validation.diagnostics));
      source = await readDocument(sourcePath, location.repositoryRoot);
      const md = source.metadata;
      const heading = /^#\s+(.+)$/m.exec(source.body)?.[1].replace(/^(?:Analysis|Improvement Audit|Research):\s*/, "");
      metadata = { schema_version: 3, kind: location.kind, slug: location.slug, title: options.title ?? heading ?? location.slug,
        intent: options.intent ?? `Findings and conclusions for ${location.slug.replace(/-/g, " ")}.`, depth: md.depth,
        created_at: md.created_at, updated_at: md.updated_at, repository: md.repository, source_sha256: digest(source.raw) };
    } else {
      if (!options.title?.trim() || !options.intent?.trim()) throw new Error("Explain requires --title and --intent describing the same subject.");
      if (!["quick", "standard", "deep"].includes(options.depth ?? "standard")) throw new Error("Depth must be quick, standard, or deep.");
      if ((await readdir(location.directory)).some(file => file !== "EXPLANATION.html")) throw new Error("An explanation may contain only its final HTML.");
      metadata = { schema_version: 3, kind: "explain", slug: location.slug, title: options.title, intent: options.intent,
        depth: (options.depth ?? "standard") as ReportMetadata["depth"], created_at: previous?.created_at ?? now, updated_at: now };
    }
    if (!metadata.title.trim() || metadata.title.length > 300) throw new Error("Title must contain 1–300 characters.");
    if (previous && (previous.kind !== metadata.kind || previous.slug !== metadata.slug || previous.intent !== metadata.intent)) throw new Error("Output belongs to another intent; use a different slug.");
    directory = await mkdtemp(join(location.directory, ".toolbox-html-"));
    temporaryDirectories.add(directory);
    await writeFile(join(directory, "report.tsx"), code);
    await writeFile(join(directory, "metadata.json"), JSON.stringify(metadata));
    const templates = ["app.tsx", "entry.tsx", "render.tsx"];
    for (const name of templates) await writeFile(join(directory, name), await readFile(join(import.meta.dir, name), "utf8"));
    await writeFile(join(directory, "reader.tsx"), await readFile(join(import.meta.dir, "report.tsx"), "utf8"));
    for (const name of ["lib/utils.ts", ...["card", "table", "chart"].map(name => `components/ui/${name}.tsx`)]) {
      await mkdir(dirname(join(directory, name)), { recursive: true });
      await writeFile(join(directory, name), await readFile(join(import.meta.dir, name), "utf8"));
    }
    const paths: Record<string, string[]> = {
      "toolbox:report": [join(directory, "report.tsx")], "toolbox:metadata": [join(directory, "metadata.json")],
      "@/report": [join(directory, "reader.tsx")], "@/lib/utils": [join(directory, "lib/utils.ts")],
    };
    for (const name of ["card", "table", "chart"]) paths[`@/components/ui/${name}`] = [join(directory, `components/ui/${name}.tsx`)];
    for (const name of ["react", "react/jsx-runtime", "react-dom/client", "react-dom/static", "recharts", "clsx", "tailwind-merge"]) paths[name] = [Bun.resolveSync(name, root)];
    await writeFile(join(directory, "tsconfig.json"), JSON.stringify({ compilerOptions: { jsx: "react-jsx", paths } }));
    const css = `@import ${JSON.stringify(Bun.resolveSync("tailwindcss/index.css", root))} source(none);\n@import ${JSON.stringify(join(import.meta.dir, "styles.css"))};\n@source "./report.tsx";\n@source ${JSON.stringify(import.meta.dir)};`;
    await writeFile(join(directory, "input.css"), css);
    const cliPath = Bun.resolveSync("@tailwindcss/cli/package.json", root);
    const cli = await Bun.file(cliPath).json();
    const styles = Bun.spawnSync([process.execPath, join(dirname(cliPath), cli.bin.tailwindcss), "--input", join(directory, "input.css"), "--output", join(directory, "styles.css"), "--minify"], { cwd: directory, timeout: 45_000, stdout: "pipe", stderr: "pipe" });
    if (!styles.success) throw new Error(`Styles failed: ${styles.stderr.toString().slice(-8000)}`);
    const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'";
    await writeFile(join(directory, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${policy}"><script>(()=>{const dark=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'})()</script><title>${escapeHTML(metadata.title)}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./styles.css"></head><body><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>`);
    const buildOptions = { root: directory, tsconfig: join(directory, "tsconfig.json"), throw: true, env: "disable" as const, define: { "process.env.NODE_ENV": '"production"' } };
    const client = await Bun.build({ ...buildOptions, entrypoints: [join(directory, "index.html")], target: "browser", compile: true, minify: true, metafile: true, splitting: false });
    if (client.outputs.length !== 1 || !client.outputs[0].path.endsWith(".html")) throw new Error("Expected one standalone HTML.");
    await Bun.build({ ...buildOptions, entrypoints: [join(directory, "render.tsx")], target: "bun", outdir: directory });
    const renderedPath = join(directory, "rendered.html");
    const rendered = Bun.spawnSync([process.execPath, "--no-env-file", join(directory, "render.js"), renderedPath], { cwd: directory, env: { NODE_ENV: "production", TZ: "UTC" }, timeout: 10_000, stdout: "pipe", stderr: "pipe" });
    if (!rendered.success) throw new Error(`Complete static rendering failed: ${rendered.stderr.toString().slice(-8000)}`);
    if ((await lstat(renderedPath)).size > maximum) throw new Error("Rendered content exceeds 64 MiB.");
    const markup = await readFile(renderedPath, "utf8");
    const credits = await notices(Object.keys(client.metafile!.inputs));
    const json = JSON.stringify(metadata).replace(/</g, "\\u003c");
    const html = await new HTMLRewriter()
      .on("#root", { element(element) { element.setInnerContent(markup, { html: true }); } })
      .on("head", { element(element) { element.append(`<script type="application/json" id="toolbox-report-metadata">${json}</script><template id="toolbox-report-notices"><pre>${escapeHTML(credits)}</pre></template>`, { html: true }); } })
      .transform(new Response(client.outputs[0])).text();
    if (!html.length || Buffer.byteLength(html) > maximum) throw new Error("Report exceeds 64 MiB.");
    const complete = join(directory, "complete.html");
    await writeFile(complete, html, { flag: "wx" });
    await readReport(complete);
    if (source && digest(await readFile(sourcePath)) !== metadata.source_sha256) throw new Error("Markdown changed during rendering; rebuild from its final bytes.");
    await assertRepositoryPath(output, location.repositoryRoot);
    const currentDigest = await readFile(output).then(digest).catch(error => { if (error.code !== "ENOENT") throw error; return undefined; });
    if (currentDigest !== previousDigest) throw new Error("Output changed during rendering; refuse to overwrite concurrent work.");
    if (existing) await rename(complete, output);
    else await link(complete, output); // No replacement when another writer creates a new report.
    return { path: output, bytes: Buffer.byteLength(html), sha256: digest(html), metadata };
  } finally {
    await rm(input, { force: true });
    if (directory) { await rm(directory, { recursive: true, force: true }); temporaryDirectories.delete(directory); }
  }
}
