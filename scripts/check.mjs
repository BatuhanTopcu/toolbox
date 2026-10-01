import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import { parse, stringify } from 'yaml';
import { generatedFiles, root } from './build.mjs';
import { configure } from './configure.mjs';

function contained(base, target) {
  const path = relative(base, target);
  assert(path !== '..' && !path.startsWith('../') && !path.startsWith('..\\') && !isAbsolute(path), `Resource escapes plugin root: ${target}`);
}

async function checkLocalLinks(base, files) {
  const boundary = await realpath(base);
  for (const file of files) {
    contained(resolve(base), resolve(file));
    contained(boundary, await realpath(file));
    const body = await readFile(file, 'utf8');
    const links = JSON.parse(execFileSync('bun', ['--eval', `
      let body = ''; for await (const chunk of process.stdin) body += chunk;
      const links = [];
      Bun.markdown.render(body, {
        link: (_, { href }) => { links.push(href); return ''; },
        image: (_, { src }) => { links.push(src); return ''; },
      });
      console.log(JSON.stringify(links));
    `], { input: body, encoding: 'utf8' }));
    for (const link of links) {
      assert(!link.startsWith('file:'), `File URLs are not portable plugin references: ${link}`);
      if (link.includes('://') || /^(?:mailto|tel|data|app|codex|skill):/i.test(link) || link.startsWith('#')) continue;
      const target = resolve(dirname(file), decodeURIComponent(link.split(/[?#]/)[0].replace(/:\d+(?::\d+)?$/, '')));
      contained(resolve(base), target);
      contained(boundary, await realpath(target));
    }
  }
}

const readJson = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));
const manifest = await readJson('plugin.json');
const validateManifest = new Ajv({ strict: false }).compile(await readJson('schemas/plugin.schema.json'));
assert(validateManifest(manifest), JSON.stringify(validateManifest.errors));
assert.deepEqual(manifest.extensions, {
  'com.openai': { interface: { displayName: 'Toolbox', composerIcon: './assets/logo.png', logo: './assets/logo.png', logoDark: './assets/logo-dark.png' } },
});
for (const [path, expected] of await generatedFiles()) assert.equal(await readFile(join(root, path), 'utf8'), expected, `${path} is stale; run pnpm build`);
const pkg = await readJson('package.json');
for (const key of ['name', 'version', 'description', 'license']) assert.equal(pkg[key], manifest[key], `package.json ${key} is stale`);
assert.deepEqual(pkg.pi, { skills: ['./skills'] });
assert.deepEqual((await readdir(join(root, 'skills'))).sort(), ['analyse', 'implement', 'improve', 'research']);
const markdownFiles = [join(root, 'README.md')];
const resourceBoundary = await realpath(root);
const branding = manifest.extensions['com.openai'].interface;
for (const asset of [branding.composerIcon, branding.logo, branding.logoDark, (await readJson('.cursor-plugin/plugin.json')).logo]) {
  const path = resolve(root, asset);
  contained(resolve(root), path);
  contained(resourceBoundary, await realpath(path));
  assert((await readFile(path)).length, `Empty branding asset: ${asset}`);
}
for (const directory of ['skills', 'shared']) {
  contained(resourceBoundary, await realpath(join(root, directory)));
  for (const entry of await readdir(join(root, directory), { recursive: true, withFileTypes: true })) {
    const path = join(entry.parentPath, entry.name);
    contained(resourceBoundary, await realpath(path));
    if ((entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith('.md')) markdownFiles.push(path);
  }
}
for (const name of await readdir(join(root, 'skills'))) {
  const skillDir = join(root, 'skills', name);
  const skillFile = join(skillDir, 'SKILL.md');
  contained(resourceBoundary, await realpath(skillDir));
  contained(resourceBoundary, await realpath(skillFile));
  if (!markdownFiles.includes(skillFile)) markdownFiles.push(skillFile);
  const text = await readFile(skillFile, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  assert(match, `${name} needs YAML frontmatter`);
  const metadata = parse(match[1]);
  assert.equal(metadata.name, name);
  assert(typeof metadata.description === 'string' && metadata.description.length && match[2].trim());
}
await checkLocalLinks(root, markdownFiles);
for (const path of ['shared/scripts/artifact-tool.ts', ...['analysis', 'improvement', 'research', 'task'].map((name) => `shared/assets/templates/${name}.md`)]) {
  contained(await realpath(root), await realpath(join(root, path)));
  assert((await readFile(join(root, path), 'utf8')).length, `Empty resource: ${path}`);
}

const temporary = await mkdtemp(join(tmpdir(), 'toolbox-check-'));
try {
  const project = join(temporary, 'project');
  await mkdir(project);
  await writeFile(join(project, 'opencode.json'), JSON.stringify({ model: 'existing/model', skills: ['existing-skills'], plugins: ['existing-plugin'] }));
  await configure(project);
  await configure(project);
  assert.deepEqual(JSON.parse(await readFile(join(project, 'opencode.json'), 'utf8')), {
    model: 'existing/model', skills: ['existing-skills', join(root, 'skills')], plugins: ['existing-plugin'],
  });
  await writeFile(join(project, 'opencode.jsonc'), '{ /* preserve comments */ }');
  await assert.rejects(configure(project), /Merge these entries/);
  assert.equal(await readFile(join(project, 'opencode.jsonc'), 'utf8'), '{ /* preserve comments */ }');

  const local = join(temporary, 'links');
  await mkdir(join(local, 'skills', 'fixture'), { recursive: true });
  await mkdir(join(local, 'shared'));
  const skill = join(local, 'skills', 'fixture', 'SKILL.md');
  await writeFile(join(local, 'shared', 'reference.md'), 'A shared resource.');
  await writeFile(join(local, 'shared', 'nested(a).md'), 'A resource with parentheses.');
  await writeFile(skill, '[shared](../../shared/reference.md)\n[reference][ref]\n\n[ref]: ../../shared/reference.md\n\n![nested](../../shared/nested(a).md)\n\n```md\n[example](../../../outside.md)\n```');
  await checkLocalLinks(local, [skill]);
  await writeFile(skill, '[missing](../../shared/missing.md)');
  await assert.rejects(checkLocalLinks(local, [skill]), /ENOENT/);
  const outside = join(temporary, 'outside.md');
  await writeFile(outside, 'Outside the resource boundary.');
  await writeFile(skill, '[escape](../../../outside.md)');
  await assert.rejects(checkLocalLinks(local, [skill]), /escapes plugin root/);
  await writeFile(skill, `[file](file://${outside})`);
  await assert.rejects(checkLocalLinks(local, [skill]), /File URLs/);
  await symlink(outside, join(local, 'shared', 'escaped.md'));
  await writeFile(skill, '[symlink](../../shared/escaped.md)');
  await assert.rejects(checkLocalLinks(local, [skill]), /escapes plugin root/);
  const externalSkills = join(temporary, 'external-skills');
  await mkdir(externalSkills);
  await writeFile(join(externalSkills, 'SKILL.md'), 'An external skill.');
  await symlink(externalSkills, join(local, 'skills', 'external'));
  await assert.rejects(checkLocalLinks(local, [join(local, 'skills', 'external', 'SKILL.md')]), /escapes plugin root/);

  const helper = (args, success = true) => {
    const result = spawnSync('bun', [join(root, 'shared/scripts/artifact-tool.ts'), ...args], { cwd: root, encoding: 'utf8' });
    if (result.error) throw result.error;
    assert.equal(result.status, success ? 0 : 1, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result;
  };
  const inspect = (path) => JSON.parse(helper(['validate', path, '--json']).stdout);
  const inventory = (repo) => JSON.parse(helper(['list', '--repo', repo, '--json']).stdout);
  const author = async (file, updates = {}) => {
    const raw = await readFile(file, 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
    assert(match);
    const metadata = { ...parse(match[1]), status: 'ready', ...updates };
    const body = match[2].replace(/<!-- REQUIRED:[\s\S]*?-->/g, 'Verified fixture content.');
    await writeFile(file, `---\n${stringify(metadata).trimEnd()}\n---\n${body}`);
  };
  const copied = join(temporary, 'copied plugin');
  await cp(root, copied, { recursive: true, filter: (path) => !['node_modules', '.git'].includes(basename(path)) });
  await checkLocalLinks(copied, markdownFiles.map((file) => join(copied, relative(root, file))));
  const copiedTemplate = join(copied, 'shared/assets/templates/research.md');
  const marker = 'Copied-template relocation fixture.';
  await writeFile(copiedTemplate, `${await readFile(copiedTemplate, 'utf8')}\n${marker}\n`);
  const copiedProject = join(temporary, 'copied-project');
  await mkdir(copiedProject);
  const copiedHelper = (args) => {
    const result = spawnSync('bun', [join(copied, 'shared/scripts/artifact-tool.ts'), ...args], { cwd: copiedProject, encoding: 'utf8' });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  const copiedArtifact = copiedHelper(['init', '--repo', copiedProject, '--mode', 'research', '--name', 'relocation']).trim();
  const copiedDocument = join(copiedArtifact, 'RESEARCH.md');
  assert((await readFile(copiedDocument, 'utf8')).includes(marker), 'Relocated helper must use copied templates');
  await author(copiedDocument);
  assert(JSON.parse(copiedHelper(['validate', copiedArtifact, '--json'])).ok);
  assert.deepEqual(inventory(project), { artifacts: [], diagnostics: [] });
  assert.match(helper(['list', '--repo', join(temporary, 'missing'), '--json'], false).stderr, /REPOSITORY_UNREADABLE/);
  const artifacts = {};
  for (const [mode, source] of [['change', 'ANALYSIS.md'], ['improve', 'IMPROVEMENT.md'], ['research', 'RESEARCH.md']]) {
    const artifact = helper(['init', '--repo', project, '--mode', mode, '--name', `${mode}-fixture`]).stdout.trim();
    artifacts[mode] = artifact;
    assert.deepEqual(await readdir(artifact), [source]);
    await author(join(artifact, source));
    assert(inspect(artifact).ok);
  }
  assert.match(helper(['add-task', artifacts.research, '--title', 'Disallowed research task'], false).stderr, /RESEARCH_TASKS_UNSUPPORTED/);
  const tasks = [];
  for (const [index, status] of ['done', 'wont-do'].entries()) {
    const file = helper(['add-task', artifacts.change, '--title', `Outcome ${index + 1}`]).stdout.trim();
    tasks.push(file);
    await author(file, { status, depends_on: index ? ['001'] : [] });
  }
  assert(inspect(artifacts.change).ok);
  await author(tasks[0], { status: 'done', depends_on: ['002'] });
  assert(JSON.parse(helper(['validate', artifacts.change, '--json'], false).stdout).diagnostics.some((item) => item.code === 'DEPENDENCY_CYCLE'));
  await author(tasks[0], { status: 'done', depends_on: [] });
  await author(tasks[1], { status: 'wont-do', depends_on: ['999'] });
  assert(JSON.parse(helper(['validate', artifacts.change, '--json'], false).stdout).diagnostics.some((item) => item.code === 'DEPENDENCY_MISSING'));
  await author(tasks[1], { status: 'wont-do', depends_on: ['001'] });
  const draft = helper(['init', '--repo', project, '--mode', 'change', '--name', 'unfinished']).stdout.trim();
  const invalid = helper(['init', '--repo', project, '--mode', 'change', '--name', 'extra-file']).stdout.trim();
  await author(join(invalid, 'ANALYSIS.md'));
  await writeFile(join(invalid, 'DELIVERY.md'), 'Unsupported extra document.');
  await author(join(artifacts.improve, 'IMPROVEMENT.md'), { status: 'superseded' });
  const listed = inventory(project);
  assert.equal(listed.artifacts.length, 5);
  const row = listed.artifacts.find((item) => item.artifact === artifacts.change);
  assert(row.eligible && row.validation.ok && isAbsolute(row.path));
  assert.equal(row.title, 'Change Fixture');
  assert.deepEqual(row.task_counts, { todo: 0, 'in-progress': 0, blocked: 0, done: 1, 'wont-do': 1 });
  for (const artifact of [draft, invalid, artifacts.improve, artifacts.research]) {
    const candidate = listed.artifacts.find((item) => item.artifact === artifact);
    assert(!candidate.eligible && candidate.reasons.length > 0);
  }
  assert(listed.diagnostics.some((item) => item.code === 'ARTIFACT_EXTRA'));
  const externalProject = join(temporary, 'external');
  await mkdir(externalProject);
  const externalArtifact = helper(['init', '--repo', externalProject, '--mode', 'change', '--name', 'external']).stdout.trim();
  await symlink(externalArtifact, join(project, '.artifacts/analyse/change/escaped'));
  assert(inventory(project).diagnostics.some((item) => item.code === 'PATH_ESCAPE'));
  assert.match(helper(['validate', join(project, '.artifacts/analyse/change/escaped')], false).stderr, /PATH_ESCAPE/);
  await rm(join(project, '.artifacts/analyse/change/escaped'));
  await rm(join(invalid, 'DELIVERY.md'));
  await rm(join(invalid, 'ANALYSIS.md'));
  await symlink(join(externalArtifact, 'ANALYSIS.md'), join(invalid, 'ANALYSIS.md'));
  assert(inventory(project).artifacts.find((item) => item.artifact === invalid).validation.diagnostics.some((item) => item.code === 'PATH_ESCAPE'));
  assert.match(helper(['validate', invalid], false).stderr, /PATH_ESCAPE/);

  const unborn = join(temporary, 'unborn');
  await mkdir(unborn);
  execFileSync('git', ['init', '--quiet', unborn]);
  await writeFile(join(unborn, 'untracked.txt'), 'Existing user work.');
  const captured = helper(['init', '--repo', unborn, '--mode', 'change', '--name', 'dirty']).stdout.trim();
  const metadata = parse((await readFile(join(captured, 'ANALYSIS.md'), 'utf8')).match(/^---\n([\s\S]*?)\n---/)[1]);
  assert.deepEqual(metadata.repository, { root: unborn, revision: 'none', dirty: true });
} finally {
  await rm(temporary, { recursive: true, force: true });
}
console.log('Validated native skill registrations, shared links, relocated resources, configuration preservation, and artifact fixtures.');
