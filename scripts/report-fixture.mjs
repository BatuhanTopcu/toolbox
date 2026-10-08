import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Real renderer output for disposable assertion/evaluation documents.
export async function writeCompanion(plugin, file) {
  if (!/\/(ANALYSIS|PLAN|IMPROVEMENT|RESEARCH)\.md$/.test(file)) return;
  const markdown = await readFile(file, 'utf8');
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  const source = join(dirname(file), '.report.tsx');
  const template = await readFile(join(plugin, 'shared/assets/templates/report.tsx'), 'utf8');
  await writeFile(source, template.replace(/\{"\{\{[A-Z_]+\}\}"\}/g, () => `{${JSON.stringify(body)}}`));
  const result = spawnSync('bun', [join(plugin, 'shared/scripts/html-report.ts'), 'build', source, '--output', file.replace(/\.md$/, '.html')], { encoding: 'utf8', timeout: 65000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}
