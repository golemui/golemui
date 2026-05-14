/**
 * Schema archival step, called from release.ts on stable releases only.
 *
 * On each release:
 *   1. Moves docs/public/schemas/*.json -> docs/public/schemas/v{VERSION}/ and
 *      rewrites their $id URLs to include the version segment.
 *      Relative $refs between schemas are left untouched (directory structure is preserved).
 *   2. Copies libs/gui/shared/src/lib/schemas/ -> docs/public/schemas/ (latest, unmodified).
 *   3. Commits the result so GitHub Pages serves both /schemas/ and /schemas/v{VERSION}/.
 *
 * First release: no schemas exist to archive, step 1 is skipped.
 * Dry-run: logs intent but performs no file I/O or git operations.
 */
import { execSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const SCHEMAS_SOURCE = 'libs/gui/shared/src/lib/schemas';
const SCHEMAS_DEST = 'docs/public/schemas';
const SCHEMA_BASE_URL = 'https://golemui.com/schemas/';

export async function archiveSchemas(version: string, dryRun: boolean): Promise<void> {
  console.log(`\nSchema archival for v${version}${dryRun ? ' (dry-run)' : ''}...`);

  try {
    // Step 1: Archive existing schemas (if any)
    try {
      const entries = readdirSync(SCHEMAS_DEST, { withFileTypes: true });
      const rootJsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.json'));

      if (rootJsonFiles.length > 0) {
        const archiveDir = join(SCHEMAS_DEST, `v${version}`);
        const archiveComponentsDir = join(archiveDir, 'components');
        console.log(`Archiving existing schemas to ${archiveDir}`);

        if (!dryRun) {
          mkdirSync(archiveComponentsDir, { recursive: true });

          for (const entry of rootJsonFiles) {
            rewriteAndMove(join(SCHEMAS_DEST, entry.name), join(archiveDir, entry.name), version);
          }

          const componentsDir = join(SCHEMAS_DEST, 'components');
          try {
            const componentEntries = readdirSync(componentsDir, { withFileTypes: true });
            for (const entry of componentEntries.filter(
              (e) => e.isFile() && e.name.endsWith('.json'),
            )) {
              rewriteAndMove(
                join(componentsDir, entry.name),
                join(archiveComponentsDir, entry.name),
                version,
              );
            }
            rmdirSync(componentsDir);
          } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
          }
        }
      } else {
        console.log('No existing schemas found, skipping archive step (first release).');
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      console.log('No existing schemas directory found, skipping archive step (first release).');
    }

    // Step 2: Copy new (current) schemas
    console.log(`Copying new schemas from ${SCHEMAS_SOURCE} to ${SCHEMAS_DEST}`);
    if (!dryRun) {
      mkdirSync(join(SCHEMAS_DEST, 'components'), { recursive: true });

      for (const entry of readdirSync(SCHEMAS_SOURCE, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          copyFileSync(join(SCHEMAS_SOURCE, entry.name), join(SCHEMAS_DEST, entry.name));
        }
      }

      const srcComponents = join(SCHEMAS_SOURCE, 'components');
      for (const entry of readdirSync(srcComponents, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          copyFileSync(
            join(srcComponents, entry.name),
            join(SCHEMAS_DEST, 'components', entry.name),
          );
        }
      }
    }

    // Step 3: Commit changes
    if (dryRun) {
      console.log(`[dry-run] Would commit: chore: archive schemas for v${version}`);
      return;
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

function rewriteAndMove(src: string, dest: string, version: string): void {
  const content = JSON.parse(readFileSync(src, 'utf-8'));
  if (typeof content.$id === 'string' && content.$id.startsWith(SCHEMA_BASE_URL)) {
    content.$id = content.$id.replace(SCHEMA_BASE_URL, `${SCHEMA_BASE_URL}v${version}/`);
  }
  writeFileSync(dest, JSON.stringify(content, null, 2) + '\n');
  unlinkSync(src);
}
