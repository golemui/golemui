/**
 * Measures what the form-definition validator weighs in a browser, by bundling the entries from
 * source with esbuild (browser platform, minified). `validator-size.spec.ts` fails above the
 * budgets below; `report-validator-size.ts` prints the numbers.
 *
 * Run the generator first (`npm run generate:validators`): the generated modules are inputs.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build, type BuildOptions, type Metafile, type OutputFile } from 'esbuild';
import { collectValidatorNeeds } from '../src/json/schemas/lazy-validators';
import { FORM_SCHEMA } from '../src/json/schemas/index';
import { planStandaloneValidators } from '../src/json/schemas/validator-schemas';

export const BUDGETS = {
  /** Everything the lazy entry loads to validate {@link REFERENCE_FORM}, gzipped. */
  lazyReferenceFormGzipBytes: 50 * 1024,
  /** The largest single validator module of the lazy entry, minified. */
  largestValidatorMinifiedBytes: 300 * 1024,
  /**
   * `validateFormDefinition` of the sync entry with everything it imports, minified. The rest of
   * `@golemui/gui-mcp/json` (the generators, `get-widget-spec` with the JSON schemas,
   * `get-concept`) is reported but has no budget here.
   */
  syncValidatorMinifiedBytes: 2.6 * 1024 * 1024,
};

/** A typical form: text input, number, select, checkbox, date picker and button. */
export const REFERENCE_FORM = {
  form: [
    {
      kind: 'input',
      type: 'textinput',
      path: 'name',
      label: 'Name',
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      kind: 'input',
      type: 'number',
      path: 'age',
      label: 'Age',
      validator: { type: 'number', minimum: 18 },
    },
    {
      kind: 'input',
      type: 'select',
      path: 'country',
      label: 'Country',
      props: { options: [{ label: 'Spain', value: 'es' }] },
    },
    { kind: 'input', type: 'checkbox', path: 'terms', label: 'I accept the terms' },
    { kind: 'input', type: 'datePicker', path: 'start', label: 'Start date' },
    { kind: 'action', type: 'button', label: 'Send', props: { actionType: 'submit' } },
  ],
};

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const GENERATED_DIRECTORY = join(PROJECT_ROOT, 'src/json/schemas/generated');

type Chunk = { path: string; minifiedBytes: number; gzipBytes: number };

export type ValidatorSizeReport = {
  lazy: {
    /** Every chunk loaded for the reference form, the entry and its shared chunks included. */
    referenceFormChunks: Chunk[];
    referenceFormMinifiedBytes: number;
    referenceFormGzipBytes: number;
    largestValidator: Chunk;
  };
  sync: {
    /** `validateFormDefinition` alone. */
    validator: { minifiedBytes: number; gzipBytes: number };
    /** The whole `@golemui/gui-mcp/json` entry. */
    entry: { minifiedBytes: number; gzipBytes: number };
  };
  /** Generated modules that call `new Function` or `require(`. Must be empty. */
  codeGenerationViolations: string[];
};

function sizeOf(file: OutputFile): { minifiedBytes: number; gzipBytes: number } {
  return { minifiedBytes: file.contents.byteLength, gzipBytes: gzipSync(file.contents).byteLength };
}

const BROWSER_BUILD = {
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  write: false,
  metafile: true,
  // No externals: a Node built-in in the graph fails the build.
  tsconfig: join(PROJECT_ROOT, 'tsconfig.lib.json'),
  logLevel: 'silent',
} as const;

/** Generated module path (relative to the generated directory, no extension) of each need. */
function neededModulePaths(formDefinition: unknown): string[] {
  const plan = planStandaloneValidators(FORM_SCHEMA);
  const needs = collectValidatorNeeds(formDefinition);
  const paths = new Set<string>();
  if (needs.root.size > 0) paths.add(plan.rootModulePath);
  if (needs.chunkRef.size > 0) paths.add(plan.chunkRefModulePath);
  for (const type of needs.shallowWidget) paths.add(plan.shallowModulePathByWidgetType[type]!);
  for (const type of needs.validatorBranch) paths.add(plan.branchModulePathByValidatorType[type]!);
  for (const kind of needs.customWidget) paths.add(plan.customModulePathByKind[kind]!);
  return [...paths];
}

async function measureLazyEntry(): Promise<ValidatorSizeReport['lazy']> {
  const outdir = join(PROJECT_ROOT, '.size-out');
  const result = await build({
    ...BROWSER_BUILD,
    entryPoints: [join(PROJECT_ROOT, 'src/json-lazy.ts')],
    splitting: true,
    outdir,
  });
  const metafile = result.metafile as Metafile;
  const fileByPath = new Map(result.outputFiles.map((file) => [relative(outdir, file.path), file]));
  const outputs = Object.entries(metafile.outputs).map(([path, output]) => ({
    path: relative(outdir, join(process.cwd(), path)),
    output,
  }));
  const generatedModuleOf = (entryPoint: string | undefined): string | undefined => {
    const match = entryPoint?.match(/schemas\/generated\/(.+)\.js$/);
    return match?.[1];
  };

  // The chunks a browser fetches: the entry, each needed validator, and their static imports.
  const needed = new Set(neededModulePaths(REFERENCE_FORM));
  const roots = outputs.filter(
    ({ output }) =>
      output.entryPoint?.endsWith('src/json-lazy.ts') ||
      needed.has(generatedModuleOf(output.entryPoint) ?? ''),
  );
  const loaded = new Set<string>();
  const visit = (path: string): void => {
    if (loaded.has(path)) return;
    loaded.add(path);
    const output = outputs.find((o) => o.path === path)?.output;
    for (const imported of output?.imports ?? []) {
      if (imported.kind === 'import-statement' && !imported.external) {
        visit(relative(outdir, join(process.cwd(), imported.path)));
      }
    }
  };
  roots.forEach(({ path }) => visit(path));
  const found = new Set(roots.map(({ output }) => generatedModuleOf(output.entryPoint)));
  const missing = [...needed].filter((path) => !found.has(path));
  if (missing.length > 0) {
    throw new Error(`No chunk for the validator modules ${missing.join(', ')}`);
  }

  const referenceFormChunks = [...loaded].map((path) => ({
    path,
    ...sizeOf(fileByPath.get(path)!),
  }));
  const validatorChunks = outputs
    .filter(({ output }) => generatedModuleOf(output.entryPoint) !== undefined)
    .map(({ path }) => ({ path, ...sizeOf(fileByPath.get(path)!) }));
  const largestValidator = validatorChunks.reduce((largest, chunk) =>
    chunk.minifiedBytes > largest.minifiedBytes ? chunk : largest,
  );
  return {
    referenceFormChunks,
    referenceFormMinifiedBytes: referenceFormChunks.reduce((sum, c) => sum + c.minifiedBytes, 0),
    referenceFormGzipBytes: referenceFormChunks.reduce((sum, c) => sum + c.gzipBytes, 0),
    largestValidator,
  };
}

async function measureSyncEntry(): Promise<ValidatorSizeReport['sync']> {
  const bundle = async (options: Pick<BuildOptions, 'stdin' | 'entryPoints'>) => {
    const result = await build({
      ...BROWSER_BUILD,
      outdir: join(PROJECT_ROOT, '.size-out'),
      ...options,
    });
    const file = result.outputFiles.find((output) => output.path.endsWith('.js'));
    if (!file) throw new Error('esbuild wrote no JavaScript');
    return sizeOf(file);
  };
  return {
    validator: await bundle({
      stdin: {
        contents: "export { validateFormDefinition } from './src/json/validate-form-definition';",
        resolveDir: PROJECT_ROOT,
        loader: 'ts',
      },
    }),
    entry: await bundle({ entryPoints: [join(PROJECT_ROOT, 'src/json.ts')] }),
  };
}

function findCodeGeneration(): string[] {
  const violations: string[] = [];
  for (const entry of readdirSync(GENERATED_DIRECTORY, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const file = join(entry.parentPath, entry.name);
    const code = readFileSync(file, 'utf8');
    if (/\bnew Function\b|\bFunction\(|\brequire\(/.test(code)) {
      violations.push(relative(GENERATED_DIRECTORY, file));
    }
  }
  return violations;
}

export async function measureValidatorSizes(): Promise<ValidatorSizeReport> {
  return {
    lazy: await measureLazyEntry(),
    sync: await measureSyncEntry(),
    codeGenerationViolations: findCodeGeneration(),
  };
}

function kilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** The report as a Markdown table, for a PR description. */
export function formatValidatorSizeReport(report: ValidatorSizeReport): string {
  const rows = [
    [
      'Lazy entry, reference form, total',
      report.lazy.referenceFormMinifiedBytes,
      report.lazy.referenceFormGzipBytes,
    ],
    ...report.lazy.referenceFormChunks
      .sort((a, b) => b.minifiedBytes - a.minifiedBytes)
      .map((chunk) => [`  ${chunk.path}`, chunk.minifiedBytes, chunk.gzipBytes] as const),
    [
      `Lazy entry, largest validator (${report.lazy.largestValidator.path})`,
      report.lazy.largestValidator.minifiedBytes,
      report.lazy.largestValidator.gzipBytes,
    ],
    [
      'Sync entry, `validateFormDefinition`',
      report.sync.validator.minifiedBytes,
      report.sync.validator.gzipBytes,
    ],
    [
      'Sync entry, all of `@golemui/gui-mcp/json`',
      report.sync.entry.minifiedBytes,
      report.sync.entry.gzipBytes,
    ],
  ] as const;
  return [
    '| What | Minified | Gzipped |',
    '| --- | --- | --- |',
    ...rows.map(
      ([what, minified, gzip]) => `| ${what} | ${kilobytes(minified)} | ${kilobytes(gzip)} |`,
    ),
  ].join('\n');
}
