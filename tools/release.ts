import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';
import { updateTemplateVersions } from './update-template-versions';

process.setMaxListeners(20);

const PUBLISHABLE_PACKAGES = [
  '@golemui/core',
  '@golemui/dx',
  '@golemui/angular',
  '@golemui/gui-angular',
  '@golemui/react',
  '@golemui/gui-react',
  '@golemui/lit',
  '@golemui/gui-lit',
  '@golemui/vue',
  '@golemui/gui-vue',
  '@golemui/gui-components',
  '@golemui/gui-validators',
  '@golemui/gui-schemas',
  '@golemui/gui-shared',
  '@golemui/gui-mcp',
];

/**
 * Derives the built `dist` directory for a publishable package from its npm name.
 * `@golemui/core` lives at `dist/libs/core`, while `gui-` scoped packages live one
 * level deeper, e.g. `@golemui/gui-mcp` => `dist/libs/gui/mcp`.
 */
function distDirForPackage(packageName: string): string {
  const shortName = packageName.replace('@golemui/', '');
  const relativePath = shortName.startsWith('gui-')
    ? join('gui', shortName.slice('gui-'.length))
    : shortName;
  return join('dist', 'libs', relativePath);
}

/**
 * Copies the root LICENSE file into every publishable package's `dist` directory
 */
function copyLicenseToPackages(dryRun: boolean) {
  const licenseFile = join(process.cwd(), 'LICENSE');
  if (!existsSync(licenseFile)) {
    console.warn(`LICENSE not found at ${licenseFile}; skipping license copy.`);
    return;
  }

  PUBLISHABLE_PACKAGES.forEach((packageName) => {
    const destDir = join(process.cwd(), distDirForPackage(packageName));
    if (!existsSync(destDir)) {
      console.warn(`Build output missing for ${packageName} (${destDir}); skipping license copy.`);
      return;
    }

    const destination = join(destDir, 'LICENSE');
    if (dryRun) {
      console.log(`[dry-run] Would copy LICENSE => ${destination}`);
      return;
    }

    copyFileSync(licenseFile, destination);
    console.log(`Copied LICENSE => ${destination}`);
  });
}

function updateSkillReferences(dryRun: boolean) {
  const refsDir = join('skills', 'golemui', 'references');
  if (dryRun) {
    console.log(`[dry-run] would regenerate and commit ${refsDir}`);
    return;
  }
  try {
    execSync('npm run generate:skill', { stdio: 'inherit' });
    const dirty = execSync(`git status --porcelain ${refsDir}`).toString().trim();
    if (!dirty) {
      console.log('Skill references already up to date.');
      return;
    }
    execSync(`git add ${refsDir}`, { stdio: 'inherit' });
    execSync('git commit -m "chore: regenerate golemui skill references"', { stdio: 'inherit' });
  } catch (e) {
    console.warn(`Skill reference regeneration skipped or failed: ${(e as Error).message}`);
  }
}

(async () => {
  const releaseType = process.env.RELEASE_TYPE === 'rc' ? 'rc' : 'stable';
  const dryRun = process.env.DRY_RUN === 'true';

  console.log(`Release type: ${releaseType}${dryRun ? ' (dry-run)' : ''}`);

  const { workspaceVersion, projectsVersionData } = await releaseVersion(
    releaseType === 'rc' ? { preid: 'rc', dryRun } : { dryRun },
  );

  // Note: this will be pushed at the same time as the changelog. One push for all.
  if (releaseType === 'stable' && workspaceVersion) {
    updateTemplateVersions(workspaceVersion, dryRun);
    updateSkillReferences(dryRun);
  }

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
    dryRun,
  });

  // Ensure the MIT license text ships inside every package tarball.
  copyLicenseToPackages(dryRun);

  const publishResult = await releasePublish({
    registry: 'https://registry.npmjs.org/',
    tag: releaseType === 'rc' ? 'next' : undefined,
    dryRun,
  });

  const ok = Object.values(publishResult).every((result) => result.code === 0);
  process.exit(ok ? 0 : 1);
})();
