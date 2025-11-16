import * as fs from 'fs-extra';
import * as path from 'path';
import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';

async function copyLibsToBuild() {
  const buildDir = path.join(process.cwd(), 'build');
  const packagesDir = path.join(process.cwd(), 'dist/libs');

  // Remove build directory if it exists and create it fresh
  await fs.remove(buildDir);
  await fs.ensureDir(buildDir);
  await fs.ensureDir(path.join(buildDir, 'libs'));

  // Get all package directories
  const packageDirs = await fs.readdir(packagesDir);

  // Copy each package directory
  for (const pkg of packageDirs) {
    const srcDir = path.join(packagesDir, pkg);
    const destDir = path.join(buildDir, 'libs', pkg);

    // Only copy if it's a directory
    const stats = await fs.stat(srcDir);
    if (!stats.isDirectory()) continue;

    await fs.copy(srcDir, destDir, {
      filter: (src) => {
        // Skip node_modules, test files, and dist folders
        return !src.includes('node_modules') && !src.includes('__tests__');
      },
    });
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

(async () => {
  await copyLibsToBuild();

  const { workspaceVersion, projectsVersionData } = await releaseVersion({});

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
  });

  await copyChangelogFiles();

  const publishResult = await releasePublish({
    registry: 'https://registry.npmjs.org/',
    access: 'public',
  });
  process.exit(Object.values(publishResult).every((result) => result.code === 0) ? 0 : 1);
})();
