#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function configure(project) {
  project = resolve(project);
  const addition = { skills: [join(root, 'skills')] };
  const read = (path) => readFile(path, 'utf8').catch((error) => { if (error.code === 'ENOENT') return undefined; throw error; });
  if (await read(join(project, 'opencode.jsonc')) !== undefined) {
    throw new Error(`Merge these entries into opencode.jsonc manually to preserve comments:\n${JSON.stringify(addition, null, 2)}`);
  }
  const path = join(project, 'opencode.json');
  const content = await read(path);
  const config = content === undefined ? {} : JSON.parse(content);
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('OpenCode configuration must be a JSON object');
  if (config.skills !== undefined && (!Array.isArray(config.skills) || !config.skills.every((item) => typeof item === 'string'))) {
    throw new Error('Existing skills must be an array of strings');
  }
  config.skills = [...new Set([...(config.skills ?? []), ...addition.skills])];
  await mkdir(project, { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2) + '\n');
  return `Configured OpenCode V2 skills in ${path}. Keep the complete checkout at ${root}.`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { project: { type: 'string' } } });
  if (positionals.length !== 1 || positionals[0] !== 'opencode' || !values.project) {
    throw new Error('Usage: node scripts/configure.mjs opencode --project /absolute/project');
  }
  console.log(await configure(values.project));
}
