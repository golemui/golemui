// eslint-disable-next-line import/no-namespace -- typing the lazily-loaded TS compiler API; mirrors typecheck.ts
import type * as TS from 'typescript';
import {
  checkReactiveExpression,
  type ExpressionFinding,
} from '../shared/lint/reactive-expressions';
import type { DxDiagnostic } from './typecheck';

/**
 * Static lints over a `gui.*` DX snippet that the TypeScript compiler cannot catch.
 *
 * The compiler is the truthful gate for *type* errors, but two real defects slip past
 * it because the code is structurally valid TypeScript:
 *
 *  1. **Misplaced `include`/`exclude` (the silent no-op).** Spreading a factory result
 *     and attaching `include`/`exclude`/`disabled`/`readonly` as a SIBLING
 *     (`{ ...gui.inputs.x(...), include: { when } }`) compiles — TS suppresses excess-property
 *     checks on object literals containing a spread — but the field never sees the
 *     condition, so it renders/behaves unconditionally. The arena caught this on a real
 *     "hide when" task. Reported as a blocking `diagnostic`.
 *
 *  2. **Reactive-expression quality.** The `when` strings inside `include`/`exclude`/etc.
 *     are opaque to the type-checker. We funnel each through the SAME engine the JSON
 *     `json_validate_form_definition` path uses ({@link checkReactiveExpression}), so the two
 *     surfaces share one set of rules. Reported as non-blocking `expressionWarnings`,
 *     mirroring the JSON path.
 */
export interface DxLintResult {
  diagnostics: DxDiagnostic[];
  expressionWarnings: ExpressionFinding[];
}

/**
 * Common config fields the factory itself owns and processes. Attached as a sibling of a
 * `gui.*` spread they are silently ignored — there is never a legitimate reason to place
 * them there, so flagging the pattern has no false positives.
 */
const CONFIG_FIELDS = ['include', 'exclude', 'disabled', 'readonly'];

export function lintDxSnippet(ts: typeof TS, sourceText: string, lineOffset: number): DxLintResult {
  const sf = ts.createSourceFile('__dx_lint__.ts', sourceText, ts.ScriptTarget.ES2020, true);
  const diagnostics: DxDiagnostic[] = [];
  const expressionWarnings: ExpressionFinding[] = [];

  const posOf = (node: TS.Node): { line: number; column: number } => {
    const p = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    return { line: p.line + 1 - lineOffset, column: p.character + 1 };
  };

  const nameOf = (name: TS.PropertyName | TS.Identifier): string | undefined => {
    if (ts.isIdentifier(name)) return name.text;
    if (ts.isStringLiteralLike(name)) return name.text;
    return undefined;
  };

  // A `gui.<ns>.<factory>(...)` call — a call whose callee is a property-access chain rooted at `gui`.
  const isGuiCall = (expr: TS.Expression): boolean => {
    if (!ts.isCallExpression(expr)) return false;
    let e: TS.Expression = expr.expression;
    while (ts.isPropertyAccessExpression(e)) e = e.expression;
    return ts.isIdentifier(e) && e.text === 'gui';
  };

  const visit = (node: TS.Node): void => {
    // (1) Misplaced common field as a sibling of a `gui.*` spread.
    if (ts.isObjectLiteralExpression(node)) {
      const spreadsGui = node.properties.some(
        (p) => ts.isSpreadAssignment(p) && isGuiCall(p.expression),
      );
      if (spreadsGui) {
        for (const p of node.properties) {
          const name =
            ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)
              ? nameOf(p.name)
              : undefined;
          if (name && CONFIG_FIELDS.includes(name)) {
            const { line, column } = posOf(p);
            diagnostics.push({
              code: 0,
              message:
                `\`${name}\` is attached as a sibling of a \`gui.*\` spread — it is a silent no-op. ` +
                'The field renders/behaves unconditionally because the factory never receives it.',
              line,
              column,
              hint:
                `Pass \`${name}\` INSIDE the factory's config argument, not via a spread: ` +
                `\`gui.inputs.x(path, { /* props */, ${name}: ... })\` — never ` +
                `\`{ ...gui.inputs.x(path, { /* props */ }), ${name}: ... }\`.`,
            });
          }
        }
      }
    }

    // (2) Reactive `when` expression quality — shared with the JSON path.
    if (
      ts.isPropertyAssignment(node) &&
      nameOf(node.name) === 'when' &&
      ts.isStringLiteralLike(node.initializer)
    ) {
      const { line, column } = posOf(node.initializer);
      for (const f of checkReactiveExpression(node.initializer.text, `when@${line}:${column}`)) {
        expressionWarnings.push(f);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);
  return { diagnostics, expressionWarnings };
}
