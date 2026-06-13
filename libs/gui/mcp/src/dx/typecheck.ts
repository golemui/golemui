// eslint-disable-next-line import/no-namespace -- the TypeScript compiler API is namespace-imported by convention
import type * as TS from 'typescript';
import type { ExpressionFinding } from '../shared/lint/reactive-expressions';
import { lintDxSnippet } from './dx-lint';
import { assertTypesAreLive, diagnose, resolveTypeCheckOptions } from './type-graph';

/**
 * In-process TypeScript type-check of a `gui.*` DX snippet against the real `@golemui`
 * type graph. This is the *truthful* gate: the arena spike proved that regex and even
 * careful human inspection score hallucinated GolemUI code as "valid" — only the compiler
 * tells the truth.
 *
 * `typescript` is imported lazily (see {@link loadTs}) so this module — and the heavy
 * compiler dependency — is only ever loaded when a DX tool is actually called; the JSON
 * validation path never touches it. The fragile part — locating and compiling against the
 * `@golemui` declarations — lives in `./type-graph`; this file only orchestrates a check
 * and turns compiler output into GolemUI-flavored diagnostics.
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

let cachedTs: typeof TS | null = null;
async function loadTs(): Promise<typeof TS> {
  if (!cachedTs) {
    cachedTs = (await import('typescript')).default ?? (await import('typescript'));
  }
  return cachedTs;
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
  const options = resolveTypeCheckOptions(ts);
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
