import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Workers reject `new Function` with an EvalError. Node raises the same error from V8 when it
// runs with `--disallow-code-generation-from-strings`, so this test needs no Workers runtime.
const TSX_CLI_PATH = createRequire(import.meta.url).resolve('tsx/cli');
const TSCONFIG_PATH = fileURLToPath(new URL('../../tsconfig.json', import.meta.url));
const FIXTURE_PATH = fileURLToPath(
  new URL('../../tools/no-code-generation-fixture.ts', import.meta.url),
);

type FixtureReport = {
  codeGenerationBlocked: boolean;
  results: { name: string; expectedValid: boolean; valid: boolean; errorCount: number }[];
};

describe('validateFormDefinition without runtime code generation', () => {
  it('validates valid and invalid forms when code generation from strings is disabled', () => {
    const child = spawnSync(
      process.execPath,
      [TSX_CLI_PATH, '--tsconfig', TSCONFIG_PATH, FIXTURE_PATH],
      {
        encoding: 'utf8',
        env: { ...process.env, NODE_OPTIONS: '--disallow-code-generation-from-strings' },
      },
    );

    expect(child.status, child.stderr).toBe(0);
    const report = JSON.parse(child.stdout) as FixtureReport;
    // Proves the child really ran with code generation disabled.
    expect(report.codeGenerationBlocked).toBe(true);
    for (const result of report.results) {
      expect(result.valid, result.name).toBe(result.expectedValid);
      if (!result.expectedValid) {
        expect(result.errorCount, result.name).toBeGreaterThan(0);
      }
    }
  });
});
