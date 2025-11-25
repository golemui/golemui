import { execSync } from 'node:child_process';
import { VersionData } from 'nx/src/command-line/release/utils/shared';
import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';

function updateLatestDistTag(projectsVersionData: VersionData) {
  const version = projectsVersionData.newVersion;
  if (version) {
    [
      '@golemui/core',
      '@golemui/angular',
      '@golemui/angular-vanilla',
      '@golemui/react',
      '@golemui/react-vanilla',
      '@golemui/lit',
      '@golemui/lit-vanilla',
      '@golemui/shared-vanilla',
      '@golemui/validators-vanilla',
    ].forEach((packageName) => {
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
  const { workspaceVersion, projectsVersionData } = await releaseVersion({});

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
  });

  const publishResult = await releasePublish({
    registry: 'https://registry.npmjs.org/',
  });

  updateLatestDistTag(projectsVersionData);

  const ok = Object.values(publishResult).every((result) => result.code === 0);
  process.exit(ok ? 0 : 1);
})();
