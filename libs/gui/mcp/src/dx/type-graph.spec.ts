import { describe, expect, it } from 'vitest';
import { resolveStrategy } from './type-graph';

/**
 * The installed/published resolution path — the one the in-repo suite can't reach (in the
 * monorepo `@golemui/*` isn't in `node_modules`, so `resolveStrategy` always takes the
 * dev/dist fallback). Here we inject the resolver to stand in for a real consumer install.
 */
describe('resolveStrategy — installed', () => {
  /**
   * Mirrors the published `@golemui/gui-shared@1.0.0` exports: only `.` and `./internals`,
   * so a `./package.json` subpath is blocked by Node's exports encapsulation.
   */
  function publishedInstall(spec: string): string {
    if (spec === '@golemui/gui-shared') {
      return '/proj/node_modules/@golemui/gui-shared/index.umd.cjs';
    }
    const err = new Error(
      `Package subpath './package.json' is not defined by "exports"`,
    ) as NodeJS.ErrnoException;
    err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
    throw err;
  }

  it('resolves from an installed package whose exports omit ./package.json', () => {
    const strat = resolveStrategy(publishedInstall);
    // installed strategy: baseUrl at the node_modules root, no dist path-overrides. A regress
    // to resolving `.../package.json` would throw here and fall to the dev/dist fallback.
    expect(strat).toEqual({ baseUrl: '/proj' });
  });
});
