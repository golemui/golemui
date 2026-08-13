import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseArgs, runCli } from './run';

describe('parseArgs', () => {
  it('reads the command and both flag spellings', () => {
    const { command, flags } = parseArgs(['init', '--name', 'kendo', '--id-base=https://x.dev/s/']);
    expect(command).toBe('init');
    expect(flags.get('name')).toBe('kendo');
    expect(flags.get('id-base')).toBe('https://x.dev/s/');
  });

  it('treats a flag followed by another flag as a boolean', () => {
    const { flags } = parseArgs(['init', '--force', '--dir', 'schemas']);
    expect(flags.get('force')).toBe(true);
    expect(flags.get('dir')).toBe('schemas');
  });

  it('keeps the first bare argument as the command', () => {
    expect(parseArgs(['generate', 'extra']).command).toBe('generate');
    expect(parseArgs([]).command).toBeUndefined();
  });
});

describe('runCli', () => {
  let workingDirectory: string;
  let logged: string[];
  let errored: string[];

  beforeEach(() => {
    workingDirectory = mkdtempSync(join(tmpdir(), 'golemui-cli-'));
    logged = [];
    errored = [];
    vi.spyOn(console, 'log').mockImplementation((message) => logged.push(String(message)));
    vi.spyOn(console, 'error').mockImplementation((message) => errored.push(String(message)));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(workingDirectory, { recursive: true, force: true });
  });

  it('prints help and fails when no command is given', async () => {
    expect(await runCli([])).toBe(1);
    expect(logged.join('\n')).toContain('npx @golemui/schemas init');
  });

  it('prints help and succeeds for --help', async () => {
    expect(await runCli(['--help'])).toBe(0);
  });

  it('rejects an unknown command', async () => {
    expect(await runCli(['bootstrap'])).toBe(1);
    expect(errored.join('\n')).toContain('Unknown command "bootstrap"');
  });

  it('rejects an implementation name that cannot be a widget type', async () => {
    const exitCode = await runCli([
      'init',
      '--name',
      'My Widgets',
      '--id-base',
      'https://x.dev/s/',
      '--dir',
      workingDirectory,
    ]);
    expect(exitCode).toBe(1);
    expect(errored.join('\n')).toContain('Invalid implementation name');
  });

  it('rejects an id base that is not an absolute http URL', async () => {
    const exitCode = await runCli([
      'init',
      '--name',
      'kendo',
      '--id-base',
      './schemas',
      '--dir',
      workingDirectory,
    ]);
    expect(exitCode).toBe(1);
    expect(errored.join('\n')).toContain('It must be an absolute URL');
  });

  it('explains where the config should be when generate finds none', async () => {
    expect(await runCli(['generate', '--dir', workingDirectory])).toBe(1);
    expect(errored.join('\n')).toContain('No schemas.config.mjs');
  });

  it('reports a config that is missing required fields', async () => {
    writeFileSync(
      join(workingDirectory, 'schemas.config.mjs'),
      'export default { implementation: "kendo" };\n',
      'utf-8',
    );
    expect(await runCli(['generate', '--dir', workingDirectory])).toBe(1);
    expect(errored.join('\n')).toContain('missing required string fields');
  });

  it('reports an id base without a trailing slash, which would join paths wrongly', async () => {
    writeFileSync(
      join(workingDirectory, 'schemas.config.mjs'),
      `export default {
        implementation: 'kendo',
        idBase: 'https://x.dev/schemas/kendo',
        generatorPath: 'x',
        formTitle: 'x',
        manifest: [{ type: 'flex', schemaFile: 'flex.schema.json', kind: 'layout' }],
      };\n`,
      'utf-8',
    );
    expect(await runCli(['generate', '--dir', workingDirectory])).toBe(1);
    expect(errored.join('\n')).toContain('must end with a slash');
  });
});
