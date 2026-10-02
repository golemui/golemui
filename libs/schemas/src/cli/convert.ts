/**
 * The `convert` command: a JSON Schema file in, a GolemUI form definition out, with the
 * preset of a widget set. The preset is loaded by name at run time, so this package never
 * depends on a widget set.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fromJsonSchema } from '../lib/json-schema/convert.js';
import { resolveRef } from '../lib/json-schema/pointer.js';
import type {
  ConvertOptions,
  DeclarativeRule,
  Diagnostic,
  JsonSchema,
  Preset,
  Rule,
  WidgetPatch,
} from '../lib/json-schema/types.js';

/** Looked up in the current directory when `--config` is not given. */
const CONFIG_FILES = ['json-schema.config.mjs', 'json-schema.config.json'];

/** The fields of a `convert` config file. Paths are relative to the config file. */
type ConvertConfig = {
  input?: string;
  output?: string;
  pointer?: string;
  /** A preset module name or path, or (in a `.mjs` config) the preset itself. */
  preset?: string | Preset;
  presetOptions?: Record<string, unknown>;
  rules?: (Rule | DeclarativeRule)[];
  overrides?: Record<string, WidgetPatch>;
  vendorKeyword?: string | false;
  maxRefDepth?: number;
  maxNodes?: number;
  transform?: ConvertOptions['transform'];
};

type Flags = ReadonlyMap<string, string | true>;

/**
 * Runs `convert`. Flags win over the config file.
 * @returns The exit code: 1 when a diagnostic reaches the `--fail-on` level, 0 otherwise.
 */
export async function runConvert(flags: Flags, positionals: readonly string[]): Promise<number> {
  const cwd = process.cwd();
  const { config, baseDir } = await loadConfig(flagValue(flags, 'config'), cwd);
  const failOn = failLevel(flagValue(flags, 'fail-on'));

  const inputPath = positionals[0]
    ? resolve(cwd, positionals[0])
    : config.input !== undefined
      ? resolve(baseDir, config.input)
      : undefined;
  if (inputPath === undefined) {
    throw new Error(
      'Missing the JSON Schema file. Pass it as `convert <schema.json>`, or set `input` in the config.',
    );
  }
  const outFlag = flagValue(flags, 'out');
  const outputPath = outFlag
    ? resolve(cwd, outFlag)
    : config.output !== undefined
      ? resolve(baseDir, config.output)
      : undefined;
  if (outputPath !== undefined && existsSync(outputPath) && flags.get('force') !== true) {
    throw new Error(
      `${relative(cwd, outputPath)} exists. A generated form is often edited by hand, so it is only replaced with --force.`,
    );
  }

  const document = readJson(inputPath);
  const pointer = flagValue(flags, 'pointer') ?? config.pointer;
  const presetFlag = flagValue(flags, 'preset');
  const preset = await loadPreset(
    presetFlag ?? config.preset,
    config.presetOptions,
    presetFlag !== undefined ? cwd : baseDir,
  );

  const { formDefinition, diagnostics } = fromJsonSchema(
    pointer === undefined ? document : subschemaAt(document, pointer),
    {
      preset,
      rules: config.rules,
      overrides: config.overrides,
      // A pointer selects the root, and `$ref`s still resolve against the whole document.
      refRoot: document,
      vendorKeyword: config.vendorKeyword,
      maxRefDepth: config.maxRefDepth,
      maxNodes: config.maxNodes,
      transform: config.transform,
    },
  );

  const text = `${JSON.stringify(formDefinition, null, 2)}\n`;
  if (outputPath === undefined) {
    process.stdout.write(text);
  } else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, text, 'utf-8');
    console.log(`Wrote ${relative(cwd, outputPath)}`);
  }
  for (const diagnostic of diagnostics) {
    console.error(formatDiagnostic(diagnostic));
  }
  return diagnostics.some((diagnostic) => failOn.includes(diagnostic.severity)) ? 1 : 0;
}

async function loadConfig(
  explicitPath: string | undefined,
  cwd: string,
): Promise<{ config: ConvertConfig; baseDir: string }> {
  const path =
    explicitPath !== undefined
      ? resolve(cwd, explicitPath)
      : CONFIG_FILES.map((file) => join(cwd, file)).find((file) => existsSync(file));
  if (path === undefined) {
    return { config: {}, baseDir: cwd };
  }
  if (!existsSync(path)) {
    throw new Error(`Config file ${explicitPath} not found.`);
  }
  const raw = path.endsWith('.json')
    ? readJson(path)
    : ((await import(/* @vite-ignore */ pathToFileURL(path).href)) as { default?: unknown })
        .default;
  return { config: assertValidConfig(raw, relative(cwd, path)), baseDir: dirname(path) };
}

const CONFIG_FIELDS: Record<keyof ConvertConfig, (value: unknown) => boolean> = {
  input: (value) => typeof value === 'string',
  output: (value) => typeof value === 'string',
  pointer: (value) => typeof value === 'string',
  preset: (value) => typeof value === 'string' || isPreset(value),
  presetOptions: isRecord,
  rules: (value) => Array.isArray(value) && value.every(isRecord),
  overrides: (value) => isRecord(value) && Object.values(value).every(isRecord),
  vendorKeyword: (value) => typeof value === 'string' || value === false,
  maxRefDepth: isPositiveInteger,
  maxNodes: isPositiveInteger,
  transform: (value) => typeof value === 'function',
};

/** Checks the config shape, so a typo fails with a sentence rather than later in the converter. */
function assertValidConfig(config: unknown, configPath: string): ConvertConfig {
  if (!isRecord(config)) {
    throw new Error(
      `${configPath} must hold a configuration object (the default export of a .mjs).`,
    );
  }
  for (const [field, value] of Object.entries(config)) {
    const isValid = CONFIG_FIELDS[field as keyof ConvertConfig];
    if (isValid === undefined) {
      throw new Error(
        `${configPath}: unknown field \`${field}\`. The fields are ${Object.keys(CONFIG_FIELDS).join(', ')}.`,
      );
    }
    if (value !== undefined && !isValid(value)) {
      throw new Error(`${configPath}: \`${field}\` has the wrong type.`);
    }
  }
  return config as ConvertConfig;
}

/**
 * The preset: given directly, or loaded from a module that exports `preset(options)`. A module
 * name resolves from `fromDir`, like an import in a file there.
 */
async function loadPreset(
  preset: string | Preset | undefined,
  options: Record<string, unknown> | undefined,
  fromDir: string,
): Promise<Preset> {
  if (preset === undefined) {
    throw new Error(
      'No preset. Pass --preset with the preset module of a widget set, e.g. ' +
        '--preset @golemui/gui-schemas/json-schema, or set `preset` in the config.',
    );
  }
  if (typeof preset !== 'string') {
    return preset;
  }
  let resolved: string;
  try {
    resolved = createRequire(join(fromDir, 'noop.js')).resolve(preset);
  } catch {
    throw new Error(`Cannot find the preset module "${preset}" from ${fromDir}. Is it installed?`);
  }
  const module = (await import(/* @vite-ignore */ pathToFileURL(resolved).href)) as {
    preset?: unknown;
    default?: { preset?: unknown };
  };
  // A CommonJS module is imported with its exports under `default`.
  const factory = module.preset ?? module.default?.preset;
  if (typeof factory !== 'function') {
    throw new Error(
      `"${preset}" has no \`preset\` export. A preset module exports \`preset(options)\`, which returns the preset.`,
    );
  }
  return factory(options ?? {}) as Preset;
}

function subschemaAt(document: JsonSchema, pointer: string): JsonSchema {
  const resolved = resolveRef(`#${pointer.replace(/^#/, '')}`, document);
  if ('error' in resolved) {
    throw new Error(`--pointer ${pointer}: ${resolved.error}`);
  }
  if (!isRecord(resolved.target)) {
    throw new Error(`--pointer ${pointer} does not point to a schema object.`);
  }
  return resolved.target;
}

function readJson(path: string): JsonSchema {
  if (!existsSync(path)) {
    throw new Error(`${path} not found.`);
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as JsonSchema;
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
}

/** The severities that fail the command. */
function failLevel(value: string | undefined): Diagnostic['severity'][] {
  switch (value) {
    case undefined:
      return [];
    case 'error':
      return ['error'];
    case 'warning':
      return ['error', 'warning'];
    default:
      throw new Error(`Invalid --fail-on "${value}". Use error or warning.`);
  }
}

/** One line per diagnostic: `warning recursive-ref at parent.parent (/$defs/Node): message`. */
function formatDiagnostic(diagnostic: Diagnostic): string {
  const where = `${diagnostic.path === '' ? '(root)' : diagnostic.path} (${diagnostic.pointer || '/'})`;
  return `${diagnostic.severity} ${diagnostic.code} at ${where}: ${diagnostic.message}`;
}

function flagValue(flags: Flags, name: string): string | undefined {
  const value = flags.get(name);
  return typeof value === 'string' ? value : undefined;
}

function isPreset(value: unknown): value is Preset {
  return isRecord(value) && Array.isArray(value['rules']) && typeof value['root'] === 'function';
}

function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
