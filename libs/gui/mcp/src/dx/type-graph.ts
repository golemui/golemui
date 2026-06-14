import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line import/no-namespace -- the TypeScript compiler API is namespace-imported by convention
import type * as TS from 'typescript';

/**
 * The `@golemui` type-checking substrate for the DX path.
 *
 * Everything fragile about running an in-process `tsc` against the real `@golemui`
 * declarations is contained in this one module: locating the type graph (installed
 * `node_modules` vs. the monorepo's built `dist/libs`), building the compiler options,
 * compiling a single in-memory file, and the liveness self-guard. {@link typeCheckDx}
 * in `typecheck.ts` orchestrates a check on top of this surface and never touches the
 * resolution details.
 *
 * This is the irreducible-but-contained fragility of the compile-is-truth approach: if
 * the type graph fails to resolve, every member access silently degrades to `any` and
 * bogus code type-checks clean. {@link assertTypesAreLive} exists precisely to refuse
 * to return results in that state.
 */

let cachedRequire: ReturnType<typeof createRequire> | undefined;

/**
 * Lazily construct a `require` bound to this module.
 *
 * Deferred (not evaluated at module load) so consumers that import only the JSON
 * tools can be bundled for non-Node runtimes (e.g. Cloudflare Workers) without
 * `createRequire(import.meta.url)` throwing at import time, where `import.meta.url`
 * is undefined. Only ever called on the DX type-check path, which is Node-only.
 */
function getRequire(): ReturnType<typeof createRequire> {
  return (cachedRequire ??= createRequire(import.meta.url));
}

/** The `@golemui` packages the `gui.*` type graph transitively references. */
const GOLEMUI_TYPE_PACKAGES = [
  { spec: '@golemui/gui-shared', rel: 'gui/shared/index.d.ts' },
  { spec: '@golemui/gui-shared/internals', rel: 'gui/shared/internals.d.ts' },
  { spec: '@golemui/gui-validators', rel: 'gui/validators/index.d.ts' },
  { spec: '@golemui/core', rel: 'core/index.d.ts' },
  { spec: '@golemui/core/internals', rel: 'core/internals.d.ts' },
] as const;

/** How many directories to walk up from this module when hunting for the built `dist/libs`. */
const DIST_SEARCH_DEPTH = 8;

/** The in-memory snippet file name the compiler host serves in place of a real file. */
const SNIPPET_FILE = '__dx_snippet__.ts';

interface ResolveStrategy {
  baseUrl: string;
  /** Explicit `.d.ts` path overrides (dev/monorepo); omitted when resolving from node_modules. */
  paths?: Record<string, string[]>;
}

/**
 * Decide how to resolve the `@golemui` type graph:
 *  1. Published/installed — `@golemui/gui-shared` is in `node_modules`: resolve naturally
 *     (no path overrides), so the types track the exact installed version.
 *  2. Dev/monorepo — packages aren't in `node_modules` (they resolve via tsconfig paths to
 *     source): fall back to mapping each package to the built `dist/libs` `.d.ts`.
 */
function resolveStrategy(): ResolveStrategy {
  try {
    const pj = getRequire().resolve('@golemui/gui-shared/package.json');
    const [root] = pj.split(/[\\/]node_modules[\\/]/);
    if (root && root !== pj) return { baseUrl: root };
  } catch {
    // not installed — fall through to the dev/monorepo dist fallback
  }
  const typesRoot = findDistTypesRoot();
  const paths: Record<string, string[]> = {};
  for (const { spec, rel } of GOLEMUI_TYPE_PACKAGES) {
    const abs = join(typesRoot, rel);
    if (existsSync(abs)) paths[spec] = [abs];
  }
  return { baseUrl: dirname(typesRoot), paths };
}

/** Dev/monorepo fallback: find the built `dist/libs` that holds the `.d.ts` graph. */
function findDistTypesRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < DIST_SEARCH_DEPTH; i++) {
    const c = join(dir, 'dist', 'libs');
    if (existsSync(join(c, 'gui', 'shared', 'index.d.ts'))) return c;
    dir = dirname(dir);
  }
  throw new Error(
    'dx_check_code: could not locate the @golemui type graph — neither an installed ' +
      "`@golemui/gui-shared` in node_modules nor the monorepo's dist/libs. The DX type-check " +
      'cannot run without the real declarations.',
  );
}

/** Build the compiler options that resolve `gui.*` against the real `@golemui` types. */
export function resolveTypeCheckOptions(ts: typeof TS): TS.CompilerOptions {
  const strat = resolveStrategy();
  return {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
    // baseUrl roots node_modules resolution (zod, @standard-schema/spec, and — in the
    // installed case — the @golemui packages themselves).
    baseUrl: strat.baseUrl,
    ...(strat.paths ? { paths: strat.paths } : {}),
  };
}

/**
 * Compile a single in-memory file against the type graph and return ONLY that file's
 * diagnostics (the host serves {@link SNIPPET_FILE} from memory; every other file is read
 * from disk as usual).
 */
export function diagnose(
  ts: typeof TS,
  code: string,
  options: TS.CompilerOptions,
): readonly TS.Diagnostic[] {
  const sf = ts.createSourceFile(SNIPPET_FILE, code, ts.ScriptTarget.ES2020, true);
  const host = ts.createCompilerHost(options, true);
  const originalGet = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) =>
    fileName === SNIPPET_FILE || resolve(fileName) === resolve(SNIPPET_FILE)
      ? sf
      : originalGet(fileName, languageVersion, onError, shouldCreate);
  const originalExists = host.fileExists.bind(host);
  host.fileExists = (fileName) =>
    fileName === SNIPPET_FILE ||
    resolve(fileName) === resolve(SNIPPET_FILE) ||
    originalExists(fileName);
  const originalRead = host.readFile.bind(host);
  host.readFile = (fileName) => (fileName === SNIPPET_FILE ? code : originalRead(fileName));

  const program = ts.createProgram([SNIPPET_FILE], options, host);
  return ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === SNIPPET_FILE);
}

/**
 * Self-guard against the failure mode that bit us during de-risk: if the type graph fails
 * to resolve, every member access silently becomes `any` and bogus code type-checks clean
 * — a confident lie. We compile a snippet that MUST fail; if it doesn't, resolution has
 * degraded and we refuse to run. Cached: the guard runs once per process.
 */
let guardChecked = false;
export function assertTypesAreLive(ts: typeof TS, options: TS.CompilerOptions): void {
  if (guardChecked) return;

  // Negative control: an invented member must fail. Catches a TOTAL collapse to `any`
  // (the whole `gui.*` graph degraded, so every member access type-checks clean).
  const bogus = `import { gui } from '@golemui/gui-shared';\n[gui.inputs.__definitely_not_a_real_member__('x', {})];\n`;
  if (diagnose(ts, bogus, options).length === 0) {
    throw new Error(
      'dx_check_code: internal type-resolution guard failed — a known-invalid snippet type-checked ' +
        'clean, which means the @golemui types resolved to `any`. Refusing to return misleading results.',
    );
  }

  // Positive control: a bare-string event handler must fail. Catches a PARTIAL degradation
  // the negative control would miss — e.g. a stale `dist` `.d.ts` that predates the
  // function-only `DxEventHandler`, where `onChange` resolves to `any` while `gui.inputs`
  // is otherwise live. Without this, the exact protection `dx_check_code` advertises could
  // silently regress and let `onChange: 'string'` through.
  const looseEvent = `import { gui } from '@golemui/gui-shared';\n[gui.inputs.textInput('x', { onChange: 'not-a-function' })];\n`;
  if (diagnose(ts, looseEvent, options).length === 0) {
    throw new Error(
      'dx_check_code: internal type-resolution guard failed — a bare-string event handler type-checked ' +
        'clean, so the DxEventHandler type resolved to `any` (likely a stale @golemui build). Refusing ' +
        'to return misleading results.',
    );
  }

  guardChecked = true;
}
