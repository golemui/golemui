/**
 * Sync the bundled JSON Schemas in @golemui/gui-mcp with the source schemas in @golemui/gui-shared.
 *
 * Usage:
 *   tsx tools/sync-mcp-schemas.ts          # copy schemas, overwrite stale snapshots
 *   tsx tools/sync-mcp-schemas.ts --check  # exit 1 if any file differs (use in CI)
 *
 * The MCP server ships a frozen copy of the schemas so it stays self-contained and offline-capable.
 * That copy MUST match what @golemui/gui-shared defines, or generated forms will validate against
 * a different shape than the runtime uses.
 */
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join, relative } from 'node:path';

const SOURCE = 'libs/gui/shared/src/lib/schemas';
const DEST = 'libs/gui/mcp/src/schemas/data';

function listJsonFiles(dir: string, prefix = ''): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listJsonFiles(full, rel));
    } else if (entry.name.endsWith('.json')) {
      out.push(rel);
    }
  }
  return out.sort();
}

const check = process.argv.includes('--check');

const sourceFiles = listJsonFiles(SOURCE);
const destFiles = (() => {
  try {
    statSync(DEST);
    return listJsonFiles(DEST);
  } catch {
    return [];
  }
})();

let diffs = 0;

// Files present in source but missing/different in dest.
for (const rel of sourceFiles) {
  const srcPath = join(SOURCE, rel);
  const dstPath = join(DEST, rel);
  let dstContent: string | null = null;
  try {
    dstContent = readFileSync(dstPath, 'utf-8');
  } catch {
    dstContent = null;
  }
  const srcContent = readFileSync(srcPath, 'utf-8');
  if (dstContent === srcContent) continue;
  diffs++;
  if (check) {
    console.error(`[diff] ${relative(process.cwd(), dstPath)}`);
  } else {
    mkdirSync(join(DEST, ...rel.split('/').slice(0, -1)), { recursive: true });
    copyFileSync(srcPath, dstPath);
    console.log(`[sync] ${relative(process.cwd(), dstPath)}`);
  }
}

// Files in dest that no longer exist in source — remove them so dead schemas don't ship.
const sourceSet = new Set(sourceFiles);
for (const rel of destFiles) {
  if (sourceSet.has(rel)) continue;
  diffs++;
  const dstPath = join(DEST, rel);
  if (check) {
    console.error(`[stale] ${relative(process.cwd(), dstPath)}`);
  } else {
    rmSync(dstPath);
    console.log(`[remove] ${relative(process.cwd(), dstPath)}`);
  }
}

if (check && diffs > 0) {
  console.error(
    `\nMCP-bundled schemas are out of date (${diffs} difference(s)). Run \`npm run sync:mcp-schemas\` and commit.`,
  );
  process.exit(1);
}

if (!check) {
  console.log(`Done. ${diffs} file(s) updated.`);
}
