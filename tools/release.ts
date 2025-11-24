import { build } from 'esbuild';
import fg from 'fast-glob';
import * as fs from 'fs-extra';
import { execSync } from 'node:child_process';
import { VersionData } from 'nx/src/command-line/release/utils/shared';
import * as path from 'path';
import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';

async function minifyDist() {
  const jsEntries = await fg(['dist/libs/**/*.js']);
  const cssEntries = await fg(['dist/libs/**/*.css']);
  const mjsEntries = await fg(['dist/libs/**/*.mjs']);

  const commonConfig = {
    outdir: 'build/libs',
    minify: true,
    bundle: false,
    allowOverwrite: true,
    outbase: 'dist/libs',
    target: 'es2022',
  };

  if (jsEntries.length > 0) {
    await build({
      ...commonConfig,
      entryPoints: jsEntries,
      format: 'esm',
      outExtension: { '.js': '.mjs' },
    });

    await build({
      ...commonConfig,
      entryPoints: jsEntries,
      format: 'cjs',
    });
  }

  if (mjsEntries.length > 0) {
    await build({
      ...commonConfig,
      entryPoints: mjsEntries,
      format: 'esm',
      outExtension: { '.js': '.mjs' },
    });
  }

  if (cssEntries.length > 0) {
    await build({
      ...commonConfig,
      entryPoints: cssEntries,
      loader: { '.css': 'css' },
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
  if (!fs.existsSync(packages)) return;

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
      '@golemui/validators-vanilla',
    ].forEach((packageName) => {
      console.log(`Updating dist-tag: latest => ${packageName}@${version}`);
      try {
        execSync(`npm dist-tag add ${packageName}@${version} latest`, {
          stdio: 'inherit',
        });
      } catch (e) {
        console.warn(
          `Failed to update dist-tag for ${packageName}. It might not be published yet.`,
        );
      }
    });
  }
}

(async () => {
  console.log('Minifying files...');
  await minifyDist();
  console.log('Copying asset files...');
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
