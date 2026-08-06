// eslint-disable-next-line import/no-namespace -- typing the lazily-loaded TS compiler API; mirrors typecheck.ts
import type * as TS from 'typescript';
import {
  checkReactiveExpression,
  type ExpressionFinding,
} from '../shared/lint/reactive-expressions';
import {
  checkBooleanValidatorRules,
  type BooleanValidatorFinding,
} from '../shared/lint/boolean-validator';
import type { DxDiagnostic } from './typecheck';

/**
 * Static lints over a `gui.*` DX snippet that the TypeScript compiler cannot catch.
 *
 * The compiler is the truthful gate for *type* errors, but three real defects slip past
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
 *
 *  3. **The mandatory-checkbox trap.** On `gui.inputs.checkbox`/`gui.inputs.booleanInput`,
 *     a validator with only half of the `required: true` + `const: true` pair type-checks
 *     but validates something the author almost never means (`required` alone passes
 *     `false`; `const` alone passes the pristine `undefined`). Shares the JSON path's rule
 *     engine ({@link checkBooleanValidatorRules}). Reported as non-blocking
 *     `validatorWarnings` — either half alone is legal, just rarely intended.
 */
export interface DxLintResult {
  diagnostics: DxDiagnostic[];
  expressionWarnings: ExpressionFinding[];
  validatorWarnings: BooleanValidatorFinding[];
}

/** DX factories whose validator is a boolean validator (the checkbox trap applies). */
const BOOLEAN_FACTORIES = ['checkbox', 'booleanInput'];

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
  const validatorWarnings: BooleanValidatorFinding[] = [];

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

  // The factory name of a `gui.*` call (`gui.inputs.checkbox(...)` -> `checkbox`), or undefined.
  const guiFactoryName = (node: TS.Node): string | undefined => {
    if (!ts.isCallExpression(node) || !isGuiCall(node)) return undefined;
    return ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : undefined;
  };

  // (3) The mandatory-checkbox trap: a boolean-widget validator with only half of the
  // `required: true` + `const: true` pair. Extracts the literal halves from the object
  // literal and funnels them through the shared rule engine. Non-literal values (a
  // spread, an identifier) make the intent unknowable statically — skip, never guess.
  const checkBooleanValidator = (validatorObj: TS.ObjectLiteralExpression): void => {
    const shape: { required?: unknown; const?: unknown } = {};
    for (const p of validatorObj.properties) {
      if (!ts.isPropertyAssignment(p)) return;
      const name = nameOf(p.name);
      if (name === 'required') {
        if (p.initializer.kind === ts.SyntaxKind.TrueKeyword) shape.required = true;
        else if (p.initializer.kind === ts.SyntaxKind.FalseKeyword) shape.required = false;
        else return;
      }
      if (name === 'const') {
        if (ts.isIdentifier(p.initializer) && p.initializer.text === 'undefined') continue;
        shape.const = true;
      }
    }
    const { line, column } = posOf(validatorObj);
    validatorWarnings.push(...checkBooleanValidatorRules(shape, `validator@${line}:${column}`));
  };

  const visit = (node: TS.Node, inTemplate: boolean, inBooleanFactory: boolean): void => {
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
      const findings = checkReactiveExpression(node.initializer.text, `when@${line}:${column}`, {
        inRepeaterTemplate: inTemplate,
      });
      for (const f of findings) {
        expressionWarnings.push(f);
      }
    }

    // (3) Boolean-widget validators — `validator` and its state-suffixed variants
    // (`'validator.<stateName>'`) inside a `gui.inputs.checkbox`/`booleanInput` config.
    if (
      inBooleanFactory &&
      ts.isPropertyAssignment(node) &&
      (nameOf(node.name) === 'validator' || nameOf(node.name)?.startsWith('validator.') === true) &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      checkBooleanValidator(node.initializer);
    }

    // A repeater's `template:` subtree gets the `$item`/`$index` scope; the flag
    // is sticky so nested templates inherit it (innermost semantics).
    const childInTemplate =
      inTemplate || (ts.isPropertyAssignment(node) && nameOf(node.name) === 'template');
    // The boolean-factory context resets at every `gui.*` call boundary, so a checkbox
    // nested inside a repeater template gets it and the repeater's own validator doesn't.
    const factory = guiFactoryName(node);
    const childInBooleanFactory =
      factory !== undefined ? BOOLEAN_FACTORIES.includes(factory) : inBooleanFactory;
    ts.forEachChild(node, (child) => visit(child, childInTemplate, childInBooleanFactory));
  };

  visit(sf, false, false);
  return { diagnostics, expressionWarnings, validatorWarnings };
}
