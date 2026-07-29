import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli, type CliIo } from './cli-commands';

/** Run the CLI with captured output. */
async function run(argv: string[]): Promise<{ code: number; out: string; err: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const io: CliIo = { out: (l) => out.push(l), err: (l) => err.push(l) };
  const code = await runCli(argv, io);
  return { code, out: out.join('\n'), err: err.join('\n') };
}

const dir = mkdtempSync(join(tmpdir(), 'golemui-cli-'));
function file(name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content, 'utf-8');
  return p;
}

describe('golemui-mcp CLI subcommands', () => {
  it('help prints usage and exits 0', async () => {
    for (const flag of ['help', '--help', '-h']) {
      const r = await run([flag]);
      expect(r.code).toBe(0);
      expect(r.out).toContain('validate-json');
      expect(r.out).toContain('check-dx');
      expect(r.out).toContain('Exit codes');
    }
  });

  it('unknown command exits 2 with usage on stderr', async () => {
    const r = await run(['frobnicate']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('unknown command "frobnicate"');
    expect(r.out).toBe('');
  });

  it('missing file argument exits 2', async () => {
    const r = await run(['validate-json']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('missing <file>');
  });

  it('unreadable file exits 2', async () => {
    const r = await run(['validate-json', join(dir, 'nope.json')]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('cannot read');
  });

  it('validate-json: a valid definition exits 0 with valid: true', async () => {
    const p = file(
      'good.json',
      JSON.stringify({
        form: [
          { kind: 'input', type: 'textinput', path: 'name', label: 'Name' },
          { kind: 'action', type: 'button', label: 'Send', actionType: 'submit' },
        ],
      }),
    );
    const r = await run(['validate-json', p]);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toMatchObject({ valid: true, errors: [] });
  });

  it('validate-json: an invalid definition exits 1 with errors', async () => {
    const p = file(
      'bad.json',
      JSON.stringify({ form: [{ kind: 'input', type: 'textinput' /* missing path */ }] }),
    );
    const r = await run(['validate-json', p]);
    expect(r.code).toBe(1);
    const parsed = JSON.parse(r.out);
    expect(parsed.valid).toBe(false);
    expect(parsed.errors.length).toBeGreaterThan(0);
  });

  it('validate-json: malformed JSON exits 2', async () => {
    const r = await run(['validate-json', file('broken.json', '{ not json')]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('not valid JSON');
  });

  it('check-dx: a real gui.* snippet exits 0 with ok: true', async () => {
    const p = file(
      'good.ts',
      "import { gui } from '@golemui/gui-shared';\n" +
        "export const form = [gui.inputs.textInput('name', { label: 'Name', validator: { required: true } })];\n",
    );
    const r = await run(['check-dx', p]);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toMatchObject({ ok: true });
  });

  it('check-dx: an invented factory exits 1 with diagnostics', async () => {
    const p = file(
      'bad.ts',
      "import { gui } from '@golemui/gui-shared';\n" +
        "export const form = [gui.actions.submitButton({ label: 'Go' })];\n",
    );
    const r = await run(['check-dx', p]);
    expect(r.code).toBe(1);
    const parsed = JSON.parse(r.out);
    expect(parsed.ok).toBe(false);
    expect(parsed.diagnostics.length).toBeGreaterThan(0);
  });

  it('check-dx: an empty file exits 2 (environmental, not a diagnosis)', async () => {
    const r = await run(['check-dx', file('empty.ts', '')]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('non-empty');
  });
});
