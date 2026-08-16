/**
 * The `golemui-schemas` command: `init` scaffolds an implementation's schema tree,
 * `generate` rebuilds the generated part of it from `schemas.config.mjs`.
 *
 * The CLI is a shell over the published builders and generator. It holds no schema
 * knowledge of its own, so it cannot drift from the library.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { generateImplementationSchemas } from '../lib/generator/generate-implementation-schemas.js';
import type { ImplementationSchemaConfig } from '../lib/manifest.types.js';
import { exampleInputWidgetType, starterFiles } from './templates.js';

const CONFIG_FILE = 'schemas.config.mjs';

const HELP = `golemui-schemas - JSON schema trees for GolemUI implementations

Usage:
  npx @golemui/schemas init [options]       scaffold a schema tree
  npx @golemui/schemas generate [options]   rebuild the generated files

Options for init:
  --name <name>       implementation name, lowercase, e.g. kendo
  --id-base <url>     absolute base URL of the published tree, e.g. https://example.com/schemas/kendo/
  --dir <path>        directory to scaffold into (default: schemas)
  --force             overwrite existing starter files

Options for generate:
  --dir <path>        directory holding ${CONFIG_FILE} (default: the current directory)

Both commands accept --help.`;

interface ParsedArgs {
  readonly command: string | undefined;
  readonly flags: ReadonlyMap<string, string | true>;
}

/** Splits argv into a command and its flags, accepting `--flag value` and `--flag=value`. */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const flags = new Map<string, string | true>();
  let command: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    if (!argument.startsWith('--')) {
      command ??= argument;
      continue;
    }
    const withoutDashes = argument.slice(2);
    const equalsIndex = withoutDashes.indexOf('=');
    if (equalsIndex !== -1) {
      flags.set(withoutDashes.slice(0, equalsIndex), withoutDashes.slice(equalsIndex + 1));
      continue;
    }
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      flags.set(withoutDashes, true);
    } else {
      flags.set(withoutDashes, next);
      index += 1;
    }
  }
  return { command, flags };
}

function flagValue(flags: ReadonlyMap<string, string | true>, name: string): string | undefined {
  const value = flags.get(name);
  return typeof value === 'string' ? value : undefined;
}

/** Asks on the terminal, or explains which flag to pass when there is no terminal. */
async function ask(question: string, fallbackFlag: string, fallback: string): Promise<string> {
  if (process.stdin.isTTY !== true) {
    throw new Error(`Missing --${fallbackFlag}. There is no terminal to ask on.`);
  }
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await readline.question(`${question} [${fallback}] `)).trim();
    return answer === '' ? fallback : answer;
  } finally {
    readline.close();
  }
}

/**
 * Implementation names end up in widget types, `$id` paths and titles, so they are
 * restricted to what is safe in all three.
 */
function assertValidName(name: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Invalid implementation name "${name}". Use lowercase letters, digits and hyphens, starting with a letter.`,
    );
  }
}

/** Normalizes the id base, which the builders join paths onto directly. */
function normalizeIdBase(idBase: string): string {
  let url: URL;
  try {
    url = new URL(idBase);
  } catch {
    throw new Error(`Invalid --id-base "${idBase}". It must be an absolute URL.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Invalid --id-base "${idBase}". It must be an http or https URL.`);
  }
  return idBase.endsWith('/') ? idBase : `${idBase}/`;
}

function writeStarterFile(packageRoot: string, relativePath: string, content: string): void {
  const path = join(packageRoot, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf-8');
  console.log(`Wrote ${relativePath}`);
}

async function runInit(flags: ReadonlyMap<string, string | true>): Promise<void> {
  const name =
    flagValue(flags, 'name') ?? (await ask('Implementation name?', 'name', 'my-widgets'));
  assertValidName(name);
  const idBase = normalizeIdBase(
    flagValue(flags, 'id-base') ??
      (await ask(
        'Base URL of the published tree?',
        'id-base',
        `https://example.com/schemas/${name}/`,
      )),
  );
  const directory = flagValue(flags, 'dir') ?? (await ask('Directory?', 'dir', 'schemas'));
  const packageRoot = resolve(process.cwd(), directory);

  const files = starterFiles({ implementation: name, idBase });
  const existing = Object.keys(files).filter((path) => existsSync(join(packageRoot, path)));
  if (existing.length > 0 && flags.get('force') !== true) {
    throw new Error(
      `Refusing to overwrite starter files you may have edited: ${existing.join(', ')}. ` +
        'Pass --force to replace them.',
    );
  }
  for (const [relativePath, content] of Object.entries(files)) {
    writeStarterFile(packageRoot, relativePath, content);
  }

  await runGenerateIn(packageRoot);

  const shown = relative(process.cwd(), packageRoot) || '.';
  console.log(`
Scaffolded the ${name} schema tree in ${shown}.

Next:
  1. Add @golemui/schemas to the project's dependencies.
  2. Write one component schema per widget under src/lib/components/, and list each one
     in ${CONFIG_FILE}. src/lib/components/example-input.schema.json is the pattern to copy.
     examples/example.form.json uses the starter type ${exampleInputWidgetType(name)}, so
     replace it together with the manifest or test/schemas.spec.ts fails.
  3. Rerun \`npx @golemui/schemas generate\` after every edit to a component schema, to
     ${CONFIG_FILE} or to validators.schema.json. A CI step that regenerates and then runs
     \`git diff --exit-code\` catches a forgotten rerun.
  4. Point a form file's "$schema" at src/lib/form.editor.schema.json, as
     examples/example.form.json does. Editors need that bundle, Ajv uses the per-file tree.`);
}

/**
 * Checks the fields the builders read, so a malformed config fails with a sentence
 * rather than a stack trace from inside a builder.
 */
function assertValidConfig(config: unknown, configPath: string): ImplementationSchemaConfig {
  if (config === null || typeof config !== 'object') {
    throw new Error(`${configPath} must export a configuration object as its default export.`);
  }
  const candidate = config as Record<string, unknown>;
  const requiredStrings = ['implementation', 'idBase', 'generatorPath', 'formTitle'];
  const missing = requiredStrings.filter((field) => typeof candidate[field] !== 'string');
  if (missing.length > 0) {
    throw new Error(`${configPath} is missing required string fields: ${missing.join(', ')}.`);
  }
  if (!Array.isArray(candidate['manifest']) || candidate['manifest'].length === 0) {
    throw new Error(`${configPath} must declare a non-empty \`manifest\` array.`);
  }
  if (!(candidate['idBase'] as string).endsWith('/')) {
    throw new Error(`${configPath}: \`idBase\` must end with a slash.`);
  }
  return config as ImplementationSchemaConfig;
}

async function runGenerateIn(packageRoot: string): Promise<void> {
  const configPath = join(packageRoot, CONFIG_FILE);
  if (!existsSync(configPath)) {
    throw new Error(
      `No ${CONFIG_FILE} in ${packageRoot}. Run this from the directory holding it, pass --dir, ` +
        'or scaffold a new tree with `npx @golemui/schemas init`.',
    );
  }
  const module = (await import(/* @vite-ignore */ pathToFileURL(configPath).href)) as {
    default?: unknown;
  };
  const config = assertValidConfig(module.default, CONFIG_FILE);
  await generateImplementationSchemas(config, packageRoot);
}

/**
 * Runs one CLI invocation.
 * @param argv - Arguments after the command name, i.e. `process.argv.slice(2)`.
 * @returns The process exit code.
 * @example
 * const code = await runCli(['init', '--name', 'kendo', '--dir', 'schemas']);
 */
export async function runCli(argv: readonly string[]): Promise<number> {
  const { command, flags } = parseArgs(argv);
  if (flags.get('help') === true || command === 'help' || command === undefined) {
    console.log(HELP);
    return command === undefined && flags.get('help') !== true ? 1 : 0;
  }
  try {
    switch (command) {
      case 'init':
        await runInit(flags);
        return 0;
      case 'generate':
        await runGenerateIn(resolve(process.cwd(), flagValue(flags, 'dir') ?? '.'));
        return 0;
      default:
        console.error(`Unknown command "${command}".\n\n${HELP}`);
        return 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}
