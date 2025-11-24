import { build } from 'esbuild';
import fg from 'fast-glob';
import * as fs from 'fs-extra';
import { execSync } from 'node:child_process';
import { VersionData } from 'nx/src/command-line/release/utils/shared';
import * as path from 'path';
import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';

async function bundleLibs() {
  const libDirs = await fg(['dist/libs/*'], { onlyDirectories: true });

  for (const libPath of libDirs) {
    const libName = path.basename(libPath);

    if (libName === 'assets') continue;

    let entryPoint = '';
    const possibleEntries = [
      path.join(libPath, 'index.js'),
      path.join(libPath, 'index.mjs'),
      path.join(libPath, 'src', 'index.js'),
      path.join(libPath, 'src', 'index.mjs'),
    ];

    for (const p of possibleEntries) {
      if (fs.existsSync(p)) {
        entryPoint = p;
        break;
      }
    }

    if (!entryPoint) {
      await fs.copy(libPath, path.join('build/libs', libName));
      continue;
    }

    const outDir = path.join('build/libs', libName);

    const buildOptions = {
      entryPoints: [entryPoint],
      bundle: true,
      minify: true,
      packages: 'external' as const,
      target: 'es2022',
    };

    await build({
      ...buildOptions,
      outfile: path.join(outDir, 'index.js'),
      format: 'esm',
    });

    await build({
      ...buildOptions,
      outfile: path.join(outDir, 'index.cjs'),
      format: 'cjs',
    });

    const cssFiles = await fg([`${libPath}/**/*.css`]);
    if (cssFiles.length > 0) {
    }
  }
}

async function copyAssetsAndTypes() {
  const files = await fg(['dist/libs/**/*.d.ts', 'dist/libs/**/*.json', 'dist/libs/**/*.md']);

  for (const file of files) {
    const destPath = file.replace('dist/libs', 'build/libs');
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(file, destPath);
  }

  const libMdFiles = await fg(['libs/*/*.md']);
  for (const file of libMdFiles) {
    const destPath = path.join('build', file);
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
        console.warn(`Tag update failed: ${e.message}`);
      }
    });
  }
}

(async () => {
  await bundleLibs();
  await copyAssetsAndTypes();

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
