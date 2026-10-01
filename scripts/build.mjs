import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
const json = (value) => JSON.stringify(value, null, 2) + '\n';

export async function generatedFiles() {
  const manifest = JSON.parse(await readFile(join(root, 'plugin.json'), 'utf8'));
  const { name, version, description, author, homepage, repository, license } = manifest;
  const identity = { name, version, description, author, homepage, repository, license };
  const catalog = 'batu';
  return new Map(Object.entries({
    '.agents/plugins/marketplace.json': {
      name: catalog,
      interface: { displayName: 'Batu' },
      plugins: [{ name, source: { source: 'local', path: './' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }],
    },
    '.claude-plugin/marketplace.json': { name: catalog, owner: author, metadata: { description }, plugins: [{ name, source: '.' }] },
    '.claude-plugin/plugin.json': { ...identity, skills: ['./skills/'] },
    '.cursor-plugin/plugin.json': { ...identity, displayName: 'Toolbox', logo: 'assets/logo.png', skills: './skills/' },
  }).map(([path, value]) => [path, json(value)]));
}

export async function build() {
  const manifest = JSON.parse(await readFile(join(root, 'plugin.json'), 'utf8'));
  const pkgPath = join(root, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
  for (const key of ['name', 'version', 'description', 'license']) pkg[key] = manifest[key];
  await writeFile(pkgPath, json(pkg));
  for (const [path, content] of await generatedFiles()) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await build();
  console.log('Built skills-only native manifests and marketplaces.');
}
