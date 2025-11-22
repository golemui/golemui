import * as fs from 'fs-extra';
import * as path from 'path';
import fg from 'fast-glob';
import { build } from 'esbuild';
import { VersionData } from 'nx/src/command-line/release/utils/shared';
import { execSync } from 'node:child_process';
import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';

async function minifyDist() {
  const jsAndCssEntries = await fg(['dist/libs/**/*.js', 'dist/libs/**/*.css']);
  const mjsEntries = await fg(['dist/libs/**/*.mjs']);

  const commonConfig = {
    outdir: 'build/libs',
    minify: true,
    bundle: false,
    allowOverwrite: true,
    outbase: 'dist/libs',
  };

  if (jsAndCssEntries.length > 0) {
    await build({
      ...commonConfig,
      entryPoints: jsAndCssEntries,
    });
  }

  if (mjsEntries.length > 0) {
    await build({
      ...commonConfig,
      entryPoints: mjsEntries,
      outExtension: { '.js': '.mjs' },
    });
  }
}

async function copyFiles() {
  const typeFiles = await fg(['dist/libs/**/*.d.ts', 'dist/libs/**/*.json', 'dist/libs/**/*.md']);

  for (const file of typeFiles) {
    const destPath = file.replace('dist/libs', 'build/libs');
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(file, destPath);
  }
}

async function copyChangelogFiles() {
  const buildDir = path.join(process.cwd(), 'build');
  const packages = path.join(process.cwd(), 'libs');
  const packageDirs = await fs.readdir(packages);

  for (const pkg of packageDirs) {
    const srcChangelogPath = path.join(packages, pkg, 'CHANGELOG.md');
    const destChangelogPath = path.join(buildDir, 'libs', pkg, 'CHANGELOG.md');

    if (await fs.pathExists(srcChangelogPath)) {
      await fs.copy(srcChangelogPath, destChangelogPath);
    }
  }
}

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
    ].forEach((packageName) => {
      console.log(`Updating dist-tag: latest => ${packageName}@${version}`);

      execSync(`npm dist-tag add ${packageName}@${version} latest`, {
        stdio: 'inherit',
      });
    });
  }
}

(async () => {
  await minifyDist();
  await copyFiles();

  const { workspaceVersion, projectsVersionData } = await releaseVersion({});

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
  });

  await copyChangelogFiles();

  const publishResult = await releasePublish({
    registry: 'https://registry.npmjs.org/',
  });

  updateLatestDistTag(projectsVersionData);

  const ok = Object.values(publishResult).every((result) => result.code === 0);
  process.exit(ok ? 0 : 1);
})();
