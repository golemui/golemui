const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

/**
 * Commit scopes must exactly match Nx project names: `nx release` only applies a
 * commit's full semver bump (feat → minor) when the scope resolves to a project,
 * otherwise it silently downgrades the commit to a patch-level side effect.
 * Scanning the project.json files keeps this list in sync with the workspace.
 */
function collectNxProjectNames(dir, names = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectNxProjectNames(fullPath, names);
    } else if (entry.name === 'project.json') {
      const { name } = JSON.parse(readFileSync(fullPath, 'utf8'));
      if (name) {
        names.push(name);
      }
    }
  }
  return names;
}

const scopes = ['apps', 'libs']
  .flatMap((root) => collectNxProjectNames(join(__dirname, root)))
  .sort();

/** @type {import('czg').UserConfig} */
module.exports = {
  scopes,
  allowCustomScopes: false,
  allowEmptyScopes: true,
  enableMultipleScopes: true,
  scopeEnumSeparator: ',',
};
