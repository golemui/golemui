import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Checks the scope of a pull request title against the projects the pull request changes.
 *
 * Why: a pull request is squashed into one commit with its title, and `nx release` computes the
 * next version from those commits. With its default `useCommitScope`, a `feat` or a breaking change
 * counts in full only for the projects its scope names. For the other projects it changes it
 * counts as a patch. So a scope that names a project the commit does not change turns a minor or
 * a major release into a patch: `feat(gui-components): add setHealth method` changed `lit`,
 * `react`, `vue` and `angular`, not `gui-components`, and was computed as 2.1.3 instead of 2.2.0.
 *
 * Rules:
 * 1. A scope that is the name of a project must be a project this pull request changes.
 * 2. A `feat` or a breaking change (`!`) that changes a project has no scope, or names at least
 *    one of the projects it changes.
 *
 * A scope that is not a project (`release`, `tools`, `templates`...) is allowed for other types.
 *
 * Usage: PR_TITLE="feat(lit): ..." node tools/check-pr-scope.ts <base> <head>
 * Runs with Node alone (no install): keep it free of dependencies and of TypeScript syntax that
 * Node cannot strip.
 */

interface Project {
  name: string;
  root: string;
}

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
}

/** Every project with a `project.json`, except the workspace root. */
function readProjects(): Project[] {
  return git('ls-files', '--', 'project.json', '*/project.json')
    .split('\n')
    .filter(Boolean)
    .map((file) => ({
      name: JSON.parse(readFileSync(file, 'utf-8')).name as string,
      root: dirname(file),
    }))
    .filter((project) => project.name && project.root !== '.');
}

/** The projects that own at least one of the files. A file belongs to the deepest root above it. */
function changedProjects(files: string[], projects: Project[]): Set<string> {
  const byDepth = [...projects].sort((a, b) => b.root.length - a.root.length);
  const changed = new Set<string>();
  for (const file of files) {
    const owner = byDepth.find((project) => file.startsWith(`${project.root}/`));
    if (owner) changed.add(owner.name);
  }
  return changed;
}

function parseTitle(title: string) {
  const match = /^(\w+)(?:\(([^)]*)\))?(!)?:\s/.exec(title);
  if (!match) return undefined;
  return {
    type: match[1],
    scopes: (match[2] ?? '')
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean),
    breaking: match[3] === '!',
  };
}

const [base, head] = process.argv.slice(2);
const title = process.env['PR_TITLE'] ?? '';
if (!base || !head || !title) {
  console.error('Usage: PR_TITLE="<title>" node tools/check-pr-scope.ts <base> <head>');
  process.exit(2);
}

const parsed = parseTitle(title);
if (!parsed) {
  // The title format is checked by the other job of the workflow.
  console.log(`"${title}" is not a conventional commit title; nothing to check here.`);
  process.exit(0);
}

const projects = readProjects();
const names = new Set(projects.map((project) => project.name));
const files = git('diff', '--name-only', `${base}...${head}`).split('\n').filter(Boolean);
const changed = changedProjects(files, projects);
const changedList = [...changed].sort().join(', ') || 'none';
const errors: string[] = [];

const notChanged = parsed.scopes.filter((scope) => names.has(scope) && !changed.has(scope));
if (notChanged.length > 0) {
  errors.push(
    `The scope names ${notChanged.map((s) => `"${s}"`).join(', ')}, but this pull request does not change ${notChanged.length > 1 ? 'those projects' : 'that project'}.`,
  );
}

const bumpsVersion = parsed.type === 'feat' || parsed.breaking;
if (
  bumpsVersion &&
  changed.size > 0 &&
  parsed.scopes.length > 0 &&
  !parsed.scopes.some((scope) => changed.has(scope))
) {
  errors.push(
    `A ${parsed.breaking ? 'breaking change' : '"feat"'} must name at least one project it changes, or have no scope. Otherwise the release counts it as a patch.`,
  );
}

if (errors.length === 0) {
  console.log(`OK: "${title}". Projects changed: ${changedList}.`);
  process.exit(0);
}

const suggestion = changed.size > 0 ? [...changed].sort().slice(0, 4).join(',') : undefined;
for (const error of errors) console.error(`::error title=PR scope::${error}`);
console.error(`\nTitle: ${title}`);
console.error(`Projects changed by this pull request: ${changedList}.`);
if (suggestion) {
  console.error(
    `Use the projects you changed as the scope, for example "${parsed.type}(${suggestion})${parsed.breaking ? '!' : ''}: ...", or no scope.`,
  );
}
process.exit(1);
