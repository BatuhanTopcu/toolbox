import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { digest, readReport, validateReport } from "../shared/html/contract.ts";
import { validateSource } from "../shared/html/source.ts";

const plugin = resolve(Bun.argv[2] ?? join(import.meta.dir, ".."));
const root = await mkdtemp(join(tmpdir(), "toolbox-html-check-"));
try {
  const directory = join(root, ".artifacts/explain/static-chart");
  await mkdir(directory, { recursive: true });
  const input = join(directory, ".report.tsx");
  const output = join(directory, "EXPLANATION.html");
  const template = await readFile(join(plugin, "shared/assets/templates/report.tsx"), "utf8");
  const content = template.replace(/\{"\{\{[A-Z_]+\}\}"\}/g, () => '{"The final report is already visible."}');
  const chart = `<ChartContainer config={{count:{label:"Requests",color:"var(--chart-1)"}}} initialDimension={{width:720,height:280}} className="h-[280px] w-full"><BarChart accessibilityLayer data={[{label:"Observed",count:42}]}><XAxis dataKey="label"/><YAxis/><Bar dataKey="count" fill="var(--color-count)" isAnimationActive={false}/></BarChart></ChartContainer><p>Observed requests: 42.</p>`;
  const source = `import { ChartContainer } from "@/components/ui/chart"; import { BarChart, Bar, XAxis, YAxis } from "recharts";\n${content.replace('</ReportSection>', `${chart}</ReportSection>`)}`;
  const build = async (text: string, succeeds = true, intent = "Understand complete static reports.") => {
    await writeFile(input, text);
    const result = Bun.spawnSync([process.execPath, join(plugin, "shared/scripts/html-report.ts"), "build", input, "--output", output, "--title", "Static chart check", "--intent", intent], { cwd: root, stdout: "pipe", stderr: "pipe", timeout: 65_000 });
    assert.equal(result.success, succeeds, result.stdout.toString() + result.stderr.toString());
    assert.deepEqual(await readdir(directory), succeeds || await Bun.file(output).exists() ? ["EXPLANATION.html"] : []);
    return result.stderr.toString();
  };
  await build(source);
  await validateReport(output);
  const html = await readFile(output, "utf8");
  assert.match(html, /recharts-surface/);
  assert.match(html, /recharts-bar-rectangle/);
  assert.match(html, /Observed requests: 42/);
  assert.match(html, /toolbox-report-notices/);
  assert(!/(?:src|href)="(?:https?:|\.\/)/.test(html), "Assets must be embedded");
  assert.equal((await readReport(output)).kind, "explain");
  const previous = digest(html);
  assert.match(await build(source, false, "A different subject."), /another intent/);
  assert.equal(digest(await readFile(output)), previous);
  assert.match(await build(content.replace('"The final report is already visible."', '"{{SUMMARY}}"'), false), /Complete the reader template/);
  assert.equal(digest(await readFile(output)), previous);
  assert.match(await build(content.replace('return <>', 'throw new Error("SSR failure"); return <>'), false), /SSR failure/);
  assert.equal(digest(await readFile(output)), previous);
  for (const text of [
    'import x from "node:fs"; export default () => <p/>;',
    'export default () => import("react");',
    'import x from "react" with {type:"macro"}; export default () => <p/>;',
    '/** @jsxImportSource private */ export default () => <p/>;',
  ]) assert.throws(() => validateSource(text));
  await build(source);
  await validateReport(output);
  console.log("Validated relocated SSR chart markup, embedded assets/notices, same-intent refresh, failure preservation/cleanup, and import boundaries.");
} finally { await rm(root, { recursive: true, force: true }); }
