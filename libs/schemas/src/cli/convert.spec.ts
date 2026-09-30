import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseArgs, runCli } from './run';

// A preset module the way a widget set ships one: it exports `preset(options)`.
const PRESET_MODULE = `
export function preset(options = {}) {
  return {
    name: 'test',
    rules: [
      {
        when: (node) => node.type === 'string',
        build: (node) => ({ kind: 'input', type: options.textType ?? 'text', path: node.path }),
      },
      {
        when: (node) => node.type === 'object',
        build: (node, context) => ({ kind: 'layout', type: 'group', children: context.buildChildren(node) }),
      },
    ],
    widgets: {},
    validator: () => undefined,
    group: (children) => ({ kind: 'layout', type: 'group', children }),
    root: (children) => children,
  };
}
`;

const SCHEMA = {
  type: 'object',
  properties: { name: { type: 'string' }, code: { type: 'string', not: { const: '' } } },
};

describe('parseArgs', () => {
  it('collects the bare arguments after the command as positionals', () => {
    const { command, positionals, flags } = parseArgs(['convert', 'a.json', '--out', 'b.json']);
    expect(command).toBe('convert');
    expect(positionals).toEqual(['a.json']);
    expect(flags.get('out')).toBe('b.json');
  });
});

describe('runCli convert', () => {
  let directory: string;
  let logged: string[];
  let errored: string[];
  let written: string;

  const file = (name: string, content: unknown) => {
    const path = join(directory, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content));
    return path;
  };
  const convert = (...args: string[]) => runCli(['convert', ...args]);

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'golemui-convert-'));
    logged = [];
    errored = [];
    written = '';
    vi.spyOn(console, 'log').mockImplementation((message) => logged.push(String(message)));
    vi.spyOn(console, 'error').mockImplementation((message) => errored.push(String(message)));
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      written += String(chunk);
      return true;
    });
    file('preset.mjs', PRESET_MODULE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  });

  it('writes the form definition to standard output and the diagnostics to standard error', async () => {
    const exitCode = await convert(
      file('schema.json', SCHEMA),
      '--preset',
      join(directory, 'preset.mjs'),
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(written)).toEqual({
      form: [
        { kind: 'input', type: 'text', path: 'name' },
        { kind: 'input', type: 'text', path: 'code' },
      ],
    });
    expect(errored).toEqual([
      'warning unsupported-keyword at code (/properties/code): `not` has no form equivalent, so the form does not check it.',
    ]);
  });

  it('writes to --out, and replaces an existing file only with --force', async () => {
    const schema = file('schema.json', SCHEMA);
    const preset = join(directory, 'preset.mjs');
    const out = join(directory, 'forms', 'form.json');

    expect(await convert(schema, '--preset', preset, '--out', out)).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf-8')).form).toHaveLength(2);
    expect(logged.join('\n')).toContain('form.json');

    writeFileSync(out, '{"edited": true}');
    expect(await convert(schema, '--preset', preset, '--out', out)).toBe(1);
    expect(errored.join('\n')).toContain('only replaced with --force');
    expect(readFileSync(out, 'utf-8')).toBe('{"edited": true}');

    expect(await convert(schema, '--preset', preset, '--out', out, '--force')).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf-8')).form).toHaveLength(2);
  });

  it('reads a .mjs config with the preset object, rules and paths relative to the config', async () => {
    file('project/schemas/signup.json', SCHEMA);
    const config = file(
      'project/json-schema.config.mjs',
      `
      import { preset } from '../preset.mjs';
      export default {
        input: 'schemas/signup.json',
        output: 'forms/signup.form.json',
        preset: preset({ textType: 'textinput' }),
        rules: [{ match: { $name: 'code' }, skip: true }],
        overrides: { name: { label: 'Full name' } },
      };
      `,
    );

    expect(await convert('--config', config)).toBe(0);
    expect(
      JSON.parse(readFileSync(join(directory, 'project/forms/signup.form.json'), 'utf-8')),
    ).toEqual({
      form: [{ kind: 'input', type: 'textinput', path: 'name', label: 'Full name' }],
    });
  });

  it('reads a .json config with a preset module name and preset options, and lets flags win', async () => {
    file('project/schema.json', SCHEMA);
    const config = file('project/json-schema.config.json', {
      input: 'schema.json',
      output: 'from-config.json',
      preset: '../preset.mjs',
      presetOptions: { textType: 'textarea' },
    });
    const out = join(directory, 'from-flag.json');

    expect(await convert('--config', config, '--out', out)).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf-8')).form[0].type).toBe('textarea');
    expect(existsSync(join(directory, 'project/from-config.json'))).toBe(false);
  });

  it('loads a CommonJS preset module', async () => {
    const commonJs = file(
      'preset.cjs',
      PRESET_MODULE.replace('export function preset', 'function preset') +
        'module.exports = { preset };',
    );

    expect(await convert(file('schema.json', SCHEMA), '--preset', commonJs)).toBe(0);
    expect(JSON.parse(written).form).toHaveLength(2);
  });

  it('converts the subschema at --pointer and resolves refs against the whole document', async () => {
    const openApi = file('openapi.json', {
      components: {
        schemas: {
          Name: { type: 'string' },
          User: { type: 'object', properties: { name: { $ref: '#/components/schemas/Name' } } },
        },
      },
    });

    await convert(
      openApi,
      '--preset',
      join(directory, 'preset.mjs'),
      '--pointer',
      '/components/schemas/User',
    );

    expect(JSON.parse(written)).toEqual({ form: [{ kind: 'input', type: 'text', path: 'name' }] });
  });

  it('fails on the diagnostics of the --fail-on level', async () => {
    const schema = file('schema.json', SCHEMA);
    const preset = join(directory, 'preset.mjs');

    expect(await convert(schema, '--preset', preset, '--fail-on', 'error')).toBe(0);
    expect(await convert(schema, '--preset', preset, '--fail-on', 'warning')).toBe(1);
  });

  it.each([
    [[], 'Missing the JSON Schema file'],
    [['schema.json'], 'No preset'],
    [['schema.json', '--preset', 'missing-preset-module'], 'Cannot find the preset module'],
    [['schema.json', '--preset', 'no-export.mjs'], 'has no `preset` export'],
    [['schema.json', '--preset', 'preset.mjs', '--fail-on', 'info'], 'Invalid --fail-on'],
    [['schema.json', '--preset', 'preset.mjs', '--pointer', '/nothing'], 'points to nothing'],
    [['missing.json', '--preset', 'preset.mjs'], 'not found'],
  ])('explains the problem with %j', async (args, message) => {
    file('schema.json', SCHEMA);
    file('no-export.mjs', 'export const other = 1;');
    const absolute = args.map((arg) => (/\.(json|mjs)$/.test(arg) ? join(directory, arg) : arg));

    expect(await convert(...absolute)).toBe(1);
    expect(errored.join('\n')).toContain(message);
  });

  it.each([
    [{ ouput: 'x.json' }, 'unknown field `ouput`'],
    [{ maxNodes: 0 }, '`maxNodes` has the wrong type'],
    [{ rules: {} }, '`rules` has the wrong type'],
  ])('rejects the config %j', async (config, message) => {
    const path = file('json-schema.config.json', config);

    expect(await convert('--config', path)).toBe(1);
    expect(errored.join('\n')).toContain(message);
  });
});
