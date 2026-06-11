import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line import/no-namespace -- the TypeScript compiler API is namespace-imported by convention
import type * as TS from 'typescript';
import type { ExpressionFinding } from '../lint/reactive-expressions';
import { lintDxSnippet } from './dx-lint';

const requireFrom = createRequire(import.meta.url);

/**
 * In-process TypeScript type-check of a `gui.*` DX snippet against the real
 * `@golemui` type graph. This is the *truthful* gate: the arena spike proved
 * that regex and even careful human inspection score hallucinated GolemUI code
 * as "valid" — only the compiler tells the truth.
 *
 * `typescript` is imported lazily (see {@link loadTs}) so this module — and the
 * heavy compiler dependency — is only ever loaded when a DX tool is actually
 * called. The JSON validation path never touches it.
 */

export interface DxDiagnostic {
  /** TypeScript diagnostic code, e.g. 2769. */
  code: number;
  /** Flattened, single-line diagnostic message. */
  message: string;
  /** 1-based line within the submitted snippet (0 if unknown). */
  line: number;
  /** 1-based column within the submitted snippet (0 if unknown). */
  column: number;
  /** A GolemUI-specific fix suggestion, when we recognize the error. */
  hint?: string;
}

export interface DxCheckResult {
  /** True when the snippet type-checks clean AND carries no blocking lint diagnostics. */
  ok: boolean;
  diagnostics: DxDiagnostic[];
  /**
   * Non-blocking reactive-expression findings (the `when` strings inside `include`/`exclude`/
   * etc.), linted by the same engine as the JSON path. Advisory — they do not flip `ok`.
   */
  expressionWarnings: ExpressionFinding[];
}

const SNIPPET_FILE = '__dx_snippet__.ts';

/** The four `@golemui` packages the `gui.*` type graph transitively references. */
const GOLEMUI_TYPE_PACKAGES = [
  { spec: '@golemui/gui-shared', rel: 'gui/shared/index.d.ts' },
  { spec: '@golemui/gui-shared/internals', rel: 'gui/shared/internals.d.ts' },
  { spec: '@golemui/gui-validators', rel: 'gui/validators/index.d.ts' },
  { spec: '@golemui/core', rel: 'core/index.d.ts' },
  { spec: '@golemui/core/internals', rel: 'core/internals.d.ts' },
] as const;

interface ResolveStrategy {
  baseUrl: string;
  /** Explicit `.d.ts` path overrides (dev/monorepo); omitted when resolving from node_modules. */
  paths?: Record<string, string[]>;
}

/**
 * Decide how to resolve the `@golemui` type graph (Option B):
 *  1. Published/installed — `@golemui/gui-shared` is in `node_modules`: resolve naturally
 *     (no path overrides), so the types track the exact installed version.
 *  2. Dev/monorepo — packages aren't in `node_modules` (they resolve via tsconfig paths to
 *     source): fall back to mapping each package to the built `dist/libs` `.d.ts`.
 */
function resolveStrategy(): ResolveStrategy {
  try {
    const pj = requireFrom.resolve('@golemui/gui-shared/package.json');
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
  for (let i = 0; i < 8; i++) {
    const c = join(dir, 'dist', 'libs');
    if (existsSync(join(c, 'gui', 'shared', 'index.d.ts'))) return c;
    dir = dirname(dir);
  }
  throw new Error(
    'check_dx_code: could not locate the @golemui type graph — neither an installed ' +
      "`@golemui/gui-shared` in node_modules nor the monorepo's dist/libs. The DX type-check " +
      'cannot run without the real declarations.',
  );
}

let cachedTs: typeof TS | null = null;
async function loadTs(): Promise<typeof TS> {
  if (!cachedTs) {
    cachedTs = (await import('typescript')).default ?? (await import('typescript'));
  }
  return cachedTs;
}

function buildOptions(ts: typeof TS, strat: ResolveStrategy): TS.CompilerOptions {
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

/** Run the compiler over a single in-memory file, returning only its diagnostics. */
function diagnose(ts: typeof TS, code: string, options: TS.CompilerOptions): readonly TS.Diagnostic[] {
  const sf = ts.createSourceFile(SNIPPET_FILE, code, ts.ScriptTarget.ES2020, true);
  const host = ts.createCompilerHost(options, true);
  const originalGet = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) =>
    fileName === SNIPPET_FILE || resolve(fileName) === resolve(SNIPPET_FILE)
      ? sf
      : originalGet(fileName, languageVersion, onError, shouldCreate);
  const originalExists = host.fileExists.bind(host);
  host.fileExists = (fileName) =>
    fileName === SNIPPET_FILE || resolve(fileName) === resolve(SNIPPET_FILE) || originalExists(fileName);
  const originalRead = host.readFile.bind(host);
  host.readFile = (fileName) => (fileName === SNIPPET_FILE ? code : originalRead(fileName));

  const program = ts.createProgram([SNIPPET_FILE], options, host);
  return ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === SNIPPET_FILE);
}

/**
 * Self-guard against the failure mode that bit us during de-risk: if the type
 * graph fails to resolve, every member access silently becomes `any` and bogus
 * code type-checks clean — a confident lie. We compile a snippet that MUST fail;
 * if it doesn't, resolution has degraded and we refuse to run.
 */
let guardChecked = false;
function assertTypesAreLive(ts: typeof TS, options: TS.CompilerOptions): void {
  if (guardChecked) return;
  const bogus = `import { gui } from '@golemui/gui-shared';\n[gui.inputs.__definitely_not_a_real_member__('x', {})];\n`;
  const diags = diagnose(ts, bogus, options);
  if (diags.length === 0) {
    throw new Error(
      'check_dx_code: internal type-resolution guard failed — a known-invalid snippet type-checked ' +
        'clean, which means the @golemui types resolved to `any`. Refusing to return misleading results.',
    );
  }
  guardChecked = true;
}

/**
 * Recognize specific GolemUI errors and attach an actionable fix. This is the
 * self-diagnostic channel: the agent reads compiler output every turn, so a teaching
 * hint here lets it fix in-band instead of paying another grounding round-trip.
 * Hints only ride on already-failing diagnostics, so a slightly-off match is low-risk.
 */
function hintFor(d: TS.Diagnostic, flat: string): string | undefined {
  if (d.code === 2339 && /submitButton/i.test(flat)) {
    return "There is no `gui.actions.submitButton`. Use `gui.actions.button({ label, actionType: 'submit' })`.";
  }
  if (d.code === 2769 && /validator/i.test(flat)) {
    return (
      'Choice widgets (`dropdown`, `radiogroup`, `select`) need a typed validator — e.g. ' +
      "`validator: { type: 'string', required: true }` — unlike `textInput`, which accepts the loose " +
      '`{ required: true }`. Add the `type`, or omit the validator.'
    );
  }
  // The items↔options asymmetry: `dropdown` takes `items`; `radiogroup`/`select` take `options`.
  if (/'items'|'options'/.test(flat)) {
    return (
      'Choice-widget option lists are not symmetric: `gui.inputs.dropdown` takes **`items`**, while ' +
      '`gui.inputs.radiogroup` and `gui.inputs.select` take **`options`** (both `{ value, label }[]`). ' +
      'Swap the key to the one this factory expects.'
    );
  }
  // Displays carry their own content key — not a generic `content`.
  if (/'content'/.test(flat)) {
    return (
      '`gui.displays.alert` uses **`text`** (not `content`); `gui.displays.markdownText` uses **`md`** ' +
      '(not `content`). Use the factory’s own content key.'
    );
  }
  return undefined;
}

/** Strip a leading/trailing Markdown code fence, if the snippet arrived fenced. */
function unfence(code: string): string {
  const m = code.match(/^\s*```[a-zA-Z]*\n([\s\S]*?)```\s*$/);
  return m ? m[1] : code;
}

/**
 * Type-check a `gui.*` DX snippet against the real `@golemui` types.
 * If the snippet does not import `gui`, a `@golemui/gui-shared` import is prepended,
 * so a bare array of `gui.inputs.*` items can be checked directly.
 */
export async function typeCheckDx(code: string): Promise<DxCheckResult> {
  const ts = await loadTs();
  const options = buildOptions(ts, resolveStrategy());
  assertTypesAreLive(ts, options);

  const body = unfence(code);
  const full = /@golemui\/gui-shared/.test(body)
    ? body
    : `import { gui } from '@golemui/gui-shared';\n${body}`;
  // Account for a prepended import line when reporting positions back to the caller.
  const lineOffset = full === body ? 0 : 1;

  const tscDiagnostics = diagnose(ts, full, options).map<DxDiagnostic>((d) => {
    const flat = ts.flattenDiagnosticMessageText(d.messageText, ' ');
    const pos = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : null;
    return {
      code: d.code,
      message: flat,
      line: pos ? pos.line + 1 - lineOffset : 0,
      column: pos ? pos.character + 1 : 0,
      hint: hintFor(d, flat),
    };
  });

  // Static lints the compiler can't see: misplaced `include`/`exclude` (blocking) and
  // reactive-expression quality (advisory). Share the JSON path's expression engine.
  const { diagnostics: lintDiagnostics, expressionWarnings } = lintDxSnippet(ts, full, lineOffset);
  const diagnostics = [...tscDiagnostics, ...lintDiagnostics];

  return { ok: diagnostics.length === 0, diagnostics, expressionWarnings };
}
