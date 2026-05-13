import { execSync } from 'node:child_process';
import { VersionData } from 'nx/src/command-line/release/utils/shared';
import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';

process.setMaxListeners(20);

const PUBLISHABLE_PACKAGES = [
  '@golemui/core',
  '@golemui/angular',
  '@golemui/gui-angular',
  '@golemui/react',
  '@golemui/gui-react',
  '@golemui/lit',
  '@golemui/gui-lit',
  '@golemui/gui-components',
  '@golemui/gui-validators',
  '@golemui/gui-shared',
];

function updateLatestDistTag(projectsVersionData: VersionData) {
  const version = projectsVersionData.newVersion;
  if (version) {
    PUBLISHABLE_PACKAGES.forEach((packageName) => {
      console.log(`Updating dist-tag: latest => ${packageName}@${version}`);
      try {
        execSync(`npm dist-tag add ${packageName}@${version} latest`, {
          stdio: 'inherit',
        });
      } catch (e) {
        console.warn(`Tag update failed: ${e.message}`);
      }
    });
  }
}

(async () => {
  const releaseType = process.env.RELEASE_TYPE === 'rc' ? 'rc' : 'stable';
  const dryRun = process.env.DRY_RUN === 'true';

  console.log(`Release type: ${releaseType}${dryRun ? ' (dry-run)' : ''}`);

  const { workspaceVersion, projectsVersionData } = await releaseVersion(
    releaseType === 'rc' ? { preid: 'rc', dryRun } : { dryRun },
  );

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
    dryRun,
  });

  const publishResult = await releasePublish({
    registry: 'https://registry.npmjs.org/',
    tag: releaseType === 'rc' ? 'next' : undefined,
    dryRun,
  });

  if (releaseType === 'stable' && !dryRun) {
    updateLatestDistTag(projectsVersionData);
  }

  const ok = Object.values(publishResult).every((result) => result.code === 0);
  process.exit(ok ? 0 : 1);
})();
