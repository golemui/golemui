import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Linting is owned by `nx run nextjs-playground:lint` (workspace flat config).
  eslint: { ignoreDuringBuilds: true },
  // The @golemui/* aliases resolve to lib TS source outside the app dir
  // (tsconfig.base.json paths, inherited via the tsconfig.json "extends");
  // externalDir lets webpack/SWC compile those workspace-root sources.
  experimental: { externalDir: true },
  // Monorepo roots, so Next does not guess them from the root lockfile.
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
};

export default nextConfig;
