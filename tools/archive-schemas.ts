// TODO: At some point, instead of keeping all versions in Git, we should move this to S3-compatible storage.
/**
 * Schema publishing step, called from release.ts on stable releases only.
 *
 * On each release, schemas are written to two locations simultaneously:
 *   1. docs/public/schemas/ - latest, $id unchanged
 *   2. docs/public/schemas/v{VERSION}/ - pinnable copy with versioned $id
 *
 * Previous versioned folders are never touched.
 * Relative $refs between schemas are left untouched (directory structure is mirrored).
 * Dry-run: logs intent but performs no file I/O or git operations.
 */
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SCHEMAS_SOURCE = 'libs/gui/shared/src/lib/schemas';
const SCHEMAS_DEST = 'docs/public/schemas';
const SCHEMA_BASE_URL = 'https://golemui.com/schemas/';

export async function archiveSchemas(version: string, dryRun: boolean): Promise<void> {
  console.log(`\nSchema archival for v${version}${dryRun ? ' (dry-run)' : ''}...`);

  if (dryRun) {
    console.log(
      `[dry-run] Would copy schemas to ${SCHEMAS_DEST}/ and ${SCHEMAS_DEST}/v${version}/`,
    );
    console.log(`[dry-run] Would commit: chore: archive schemas for v${version}`);
    return;
  }

  try {
    const versionedDir = join(SCHEMAS_DEST, `v${version}`);
    mkdirSync(join(SCHEMAS_DEST, 'components'), { recursive: true });
    mkdirSync(join(versionedDir, 'components'), { recursive: true });

    const rootFiles = readdirSync(SCHEMAS_SOURCE, { withFileTypes: true }).filter(
      (e) => e.isFile() && e.name.endsWith('.json'),
    );
    const componentFiles = readdirSync(join(SCHEMAS_SOURCE, 'components'), {
      withFileTypes: true,
    }).filter((e) => e.isFile() && e.name.endsWith('.json'));

    // Copy to /schemas/ as-is (latest)
    for (const entry of rootFiles) {
      copyFileSync(join(SCHEMAS_SOURCE, entry.name), join(SCHEMAS_DEST, entry.name));
    }
    for (const entry of componentFiles) {
      copyFileSync(
        join(SCHEMAS_SOURCE, 'components', entry.name),
        join(SCHEMAS_DEST, 'components', entry.name),
      );
    }

    // Copy to /schemas/v{VERSION}/ with versioned $id
    for (const entry of rootFiles) {
      rewriteAndCopy(join(SCHEMAS_SOURCE, entry.name), join(versionedDir, entry.name), version);
    }
    for (const entry of componentFiles) {
      rewriteAndCopy(
        join(SCHEMAS_SOURCE, 'components', entry.name),
        join(versionedDir, 'components', entry.name),
        version,
      );
    }

    try {
      execSync(`git add ${SCHEMAS_DEST}`, { stdio: 'inherit' });
      execSync(`git commit -m "chore: archive schemas for v${version}"`, { stdio: 'inherit' });
    } catch (e) {
      console.warn(`Git commit skipped or failed: ${(e as Error).message}`);
    }

    console.log('Schema archival complete.');
  } catch (e) {
    console.error(`Schema archival failed: ${(e as Error).message}`);
    throw e;
  }
}

function rewriteAndCopy(src: string, dest: string, version: string): void {
  const content = JSON.parse(readFileSync(src, 'utf-8'));
  if (typeof content.$id === 'string' && content.$id.startsWith(SCHEMA_BASE_URL)) {
    content.$id = content.$id.replace(SCHEMA_BASE_URL, `${SCHEMA_BASE_URL}v${version}/`);
  }
  writeFileSync(dest, JSON.stringify(content, null, 2) + '\n');
}
