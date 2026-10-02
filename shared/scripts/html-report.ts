#!/usr/bin/env bun
import { rmSync } from "node:fs";
import { lstat } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { assertRepositoryPath, validateArtifact } from "./artifact-tool.ts";
import { reportLocation, validateReport } from "../html/contract.ts";

const help = `Toolbox HTML reports (Bun 1.4.0+)
  build <absolute-artifact-dir>/.report.tsx --output <canonical-absolute-html> [--title <title>] [--intent <same-intent>] [--depth <quick|standard|deep>]
  validate <canonical-absolute-html>
Build consumes temporary .report.tsx, waits for full SSR, embeds all assets, and atomically refreshes only the same intent.
Explain requires --title and --intent. Paired reports derive scope/freshness from their final schema-3 Markdown.
`;
const directories = new Set<string>();
let sourceToClean: string | undefined;
process.once("exit", () => {
  if (sourceToClean) rmSync(sourceToClean, { force: true });
  for (const directory of directories) rmSync(directory, { recursive: true, force: true });
});
process.once("SIGINT", () => process.exit(130));
process.once("SIGTERM", () => process.exit(143));
const deadline = setTimeout(() => { console.error("HTML build exceeded 60 seconds."); process.exit(1); }, 60_000);
deadline.unref();

try {
  const { positionals, values } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true, options: {
    output: { type: "string" }, title: { type: "string" }, intent: { type: "string" }, depth: { type: "string" }, help: { type: "boolean", short: "h" },
  } });
  const [command, file] = positionals;
  if (values.help || !command) console.log(help);
  else if (command === "build" && file && values.output && positionals.length === 2) {
    const location = reportLocation(values.output);
    if (isAbsolute(file) && isAbsolute(values.output) && resolve(file) === join(location.directory, ".report.tsx")) {
      await assertRepositoryPath(file, location.repositoryRoot);
      if ((await lstat(file)).isFile()) sourceToClean = file;
    }
    const pluginRoot = resolve(import.meta.dir, "../..");
    for (const dependency of ["@babel/parser", "@tailwindcss/cli/package.json", "react", "react-dom/static", "recharts", "clsx", "tailwind-merge"]) {
      try { Bun.resolveSync(dependency, pluginRoot); } catch { throw new Error(`Missing public rendering dependencies. Run pnpm install --frozen-lockfile in ${pluginRoot}, then retry. No packages belong in the target repository.`); }
    }
    const { buildReport } = await import("../html/build.ts");
    console.log(JSON.stringify(await buildReport(file, values.output, values, directories)));
  } else if (command === "validate" && file && positionals.length === 2) {
    const location = reportLocation(file);
    await assertRepositoryPath(file, location.repositoryRoot);
    if (location.kind === "explain") await validateReport(file);
    else {
      const result = await validateArtifact(location.directory);
      if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
    }
    console.log(`VALID ${file}`);
  } else throw new Error(help);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  if (sourceToClean) { rmSync(sourceToClean, { force: true }); sourceToClean = undefined; }
}
