import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATES_DIR = join(process.cwd(), 'templates');

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function bumpGolemuiDeps(
  deps: Record<string, string> | undefined,
  version: string,
): { changed: boolean; deps: Record<string, string> | undefined } {
  if (!deps) return { changed: false, deps };
  let changed = false;
  const next = { ...deps };
  for (const name of Object.keys(next)) {
    if (name.startsWith('@golemui/') && next[name] !== version) {
      next[name] = version;
      changed = true;
    }
  }
  return { changed, deps: next };
}

export function updateTemplateVersions(version: string, dryRun: boolean): string[] {
  console.log(`\nTemplate version bump for v${version}${dryRun ? ' (dry-run)' : ''}...`);
  const updated: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(TEMPLATES_DIR);
  } catch {
    return updated;
  }

  for (const entry of entries) {
    if (entry.startsWith('_')) continue;
    const dir = join(TEMPLATES_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;

    const pkgPath = join(dir, 'package.json');
    let raw: string;
    try {
      raw = readFileSync(pkgPath, 'utf8');
    } catch {
      continue;
    }

    const pkg: PackageJson = JSON.parse(raw);
    const dep = bumpGolemuiDeps(pkg.dependencies, version);
    const devDep = bumpGolemuiDeps(pkg.devDependencies, version);

    if (!dep.changed && !devDep.changed) continue;

    pkg.dependencies = dep.deps;
    pkg.devDependencies = devDep.deps;

    const next = JSON.stringify(pkg, null, 2) + (raw.endsWith('\n') ? '\n' : '');
    if (dryRun) {
      console.log(`[dry-run] would bump ${pkgPath} @golemui/* → ${version}`);
    } else {
      writeFileSync(pkgPath, next);
      console.log(`Bumped ${pkgPath} @golemui/* → ${version}`);
    }
    updated.push(pkgPath);
  }

  if (!dryRun && updated.length > 0) {
    try {
      execSync(`git add ${TEMPLATES_DIR}`, { stdio: 'inherit' });
      execSync(`git commit -m "chore: bump template versions to v${version}"`, {
        stdio: 'inherit',
      });
    } catch (e) {
      console.warn(`Template version commit skipped or failed: ${(e as Error).message}`);
    }
  }

  return updated;
}
