export type ExpressionFinding = {
  path: string;
  expression: string;
  message: string;
  suggestion?: string;
};

/**
 * Lints reactive expressions inside a form definition without executing them.
 * GolemUI expressions are evaluated by the `subscript` package; here we only catch
 * mistakes that are obvious from the syntax:
 *   - empty expressions
 *   - unbalanced parentheses / brackets / braces
 *   - missing `$form` prefix (LLMs sometimes write bare property names)
 *   - common operator typos (`=` instead of `===`, `&` instead of `&&`)
 *
 * We deliberately don't try to fully parse: too easy to get false positives, too little gain.
 */
export function lintReactiveExpressions(formDefinition: unknown): ExpressionFinding[] {
  const findings: ExpressionFinding[] = [];
  walk(formDefinition, '', findings, false, false);
  return findings;
}

export type CheckExpressionOptions = {
  /**
   * True when the expression lives inside a repeater `props.template`, where the
   * `$item` and `$index` scope variables are available.
   */
  inRepeaterTemplate?: boolean;
};

/**
 * Lint a single reactive expression string in isolation, against the same rules
 * `lintReactiveExpressions` applies while walking a JSON form definition. This is
 * the shared engine the DX path (`dx_check_code`) reuses: the JSON walker has the
 * object tree, the DX linter has the AST — both funnel each `when` expression
 * through here so the two surfaces can never drift.
 */
export function checkReactiveExpression(
  expression: string,
  path = '',
  options: CheckExpressionOptions = {},
): ExpressionFinding[] {
  const out: ExpressionFinding[] = [];
  checkExpression(expression, path, out, options.inRepeaterTemplate === true);
  return out;
}

function walk(
  node: unknown,
  path: string,
  out: ExpressionFinding[],
  inTemplate: boolean,
  propsOfRepeater: boolean,
): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}/${i}`, out, inTemplate, false));
    return;
  }
  const obj = node as Record<string, unknown>;

  // include / exclude objects: { when: '...' } or { in: [...] } / { from: [...] }
  for (const key of ['include', 'exclude']) {
    const child = obj[key];
    if (child && typeof child === 'object' && 'when' in (child as object)) {
      const expr = (child as { when: unknown }).when;
      if (typeof expr === 'string') {
        checkExpression(expr, `${path}/${key}/when`, out, inTemplate);
      }
    }
  }

  // states map: { someState: '...expression...' }
  // States are global scope, so `$item`/`$index` are never available here.
  if (path === '' && obj['states'] && typeof obj['states'] === 'object') {
    for (const [name, expr] of Object.entries(obj['states'] as Record<string, unknown>)) {
      if (typeof expr === 'string') {
        checkExpression(expr, `/states/${name}`, out, false);
      }
    }
  }

  // Any `*.when` property nested inside boolOrWhen-typed fields (disabled, readonly, etc.)
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'when' in (v as object)) {
      const expr = (v as { when: unknown }).when;
      if (typeof expr === 'string' && k !== 'include' && k !== 'exclude') {
        checkExpression(expr, `${path}/${k}/when`, out, inTemplate);
      }
    }
    if (typeof v === 'object' && v !== null) {
      // A repeater's `props.template` subtree gets the `$item`/`$index` scope.
      // The flag is sticky so nested templates inherit it (innermost semantics).
      const childInTemplate = inTemplate || (propsOfRepeater && k === 'template');
      walk(v, `${path}/${k}`, out, childInTemplate, obj['type'] === 'repeater' && k === 'props');
    }
  }
}

function checkExpression(
  expr: string,
  path: string,
  out: ExpressionFinding[],
  inTemplate: boolean,
): void {
  const trimmed = expr.trim();
  if (!trimmed) {
    out.push({ path, expression: expr, message: 'Expression is empty.' });
    return;
  }

  // Brackets balance.
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  for (const ch of trimmed) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (')]}'.includes(ch)) {
      if (stack.pop() !== pairs[ch]) {
        out.push({
          path,
          expression: expr,
          message: `Unbalanced \`${ch}\` in reactive expression.`,
        });
        return;
      }
    }
  }
  if (stack.length) {
    out.push({
      path,
      expression: expr,
      message: `Unclosed \`${stack[stack.length - 1]}\` in reactive expression.`,
    });
    return;
  }

  // Missing root reference. Allowed roots:
  //   $form           — form data
  //   $meta           — user-supplied form metadata (e.g. systemMessage, connectionStatus)
  //   $formIsInvalid  — boolean; true when any field currently fails validation
  //   $fn             — host-provided pure functions (from the `functions` init config)
  //   $item / $index  — current repeater item and its position; only inside a repeater `props.template`
  const referencesItemScope = /\$item\b|\$index\b/.test(trimmed);
  const hasGlobalRoot = /\$form\b|\$meta\b|\$formIsInvalid\b|\$fn\b/.test(trimmed);
  if (referencesItemScope && !inTemplate) {
    out.push({
      path,
      expression: expr,
      message:
        'Expression references `$item` or `$index`, which are only available inside a repeater `props.template`.',
      suggestion:
        'Move the widget inside the repeater template, or read the data through `$form` (e.g. `$form.lineItems?.[0]?.quantity`).',
    });
  } else if (!hasGlobalRoot && !(inTemplate && referencesItemScope)) {
    out.push({
      path,
      expression: expr,
      message: 'Expression does not reference `$form`, `$meta`, `$formIsInvalid`, or `$fn`.',
      suggestion:
        'GolemUI expressions read form data via `$form.fieldName`, form metadata via `$meta.key`, or the built-in `$formIsInvalid` boolean. Host-provided pure functions are callable via `$fn.functionName(...)` when the host passes a `functions` map in the form init config. Inside a repeater `props.template` the current item is available via `$item` and its position via `$index`. Did you forget the prefix?',
    });
  }

  // `=` (assignment) where `===` was probably meant.
  // Skip if `==` or `===` or `!=` already there at that position.
  if (/(?<![=!<>])=(?![=>])/.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message: 'Expression contains a single `=` (assignment). Reactive expressions are read-only.',
      suggestion: 'Use `===` for equality comparison.',
    });
  }

  // `&` or `|` instead of `&&` / `||`.
  if (/(?<![&])&(?![&])/.test(trimmed) || /(?<![|])\|(?![|])/.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message: 'Expression contains a single `&` or `|` (bitwise).',
      suggestion: 'Use `&&` for logical AND, `||` for logical OR.',
    });
  }

  // ---------------------------------------------------------------------------
  // Defensive-coding rules — form data values can be `undefined`, so the safe
  // patterns are explicit comparisons, optional chaining, and strict equality.
  // ---------------------------------------------------------------------------

  // R1: loose equality (`==` / `!=`) does type coercion and hides undefined bugs.
  if (/(?<![=!])==(?!=)/.test(trimmed) || /(?<![!])!=(?!=)/.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message: 'Expression uses loose equality (`==` or `!=`).',
      suggestion:
        'Use strict equality `===` / `!==` to avoid type coercion (e.g. `$form.x !== undefined` rather than `$form.x != null`).',
    });
  }

  // R2: negation of a `$form`/`$meta`/`$item` reference (`!$form.x`).
  // The lookbehind/lookahead exclude `!=` and `!==` operators.
  // `$index` is exempt from the defensive rules: it is always a defined number.
  if (/(?<![=!])!\s*\$(?:form|meta|item)\b/.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message:
        'Expression negates a `$form`/`$meta`/`$item` reference (relies on truthy/falsy coercion).',
      suggestion:
        'Form data values can be `undefined`. Pick the case you actually mean and write it explicitly — `$form.x === undefined`, `$form.x === null`, `$form.x === 0`, `$form.x === ""` — instead of `!$form.x`.',
    });
  }

  // R3: chained nested-property access without optional chaining.
  // For each `$root.<chain>` match, split the chain on `.` and walk segment pairs.
  // A transition from segments[i] to segments[i+1] is safe iff segments[i] ends with `?`.
  const refChainRe = /\$(?:form|meta|item)\b((?:\.[\w?]+)*)/g;
  let chainFlagged = false;
  let chainMatch: RegExpExecArray | null;
  while ((chainMatch = refChainRe.exec(trimmed)) !== null) {
    const chain = chainMatch[1];
    if (!chain) continue; // bare `$form` / `$meta` — no chain to walk
    const segments = chain.split('.').filter(Boolean);
    let unsafe = false;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (!segment || !segment.endsWith('?')) {
        unsafe = true;
        break;
      }
    }
    if (unsafe && !chainFlagged) {
      out.push({
        path,
        expression: expr,
        message:
          'Expression chains nested property access without optional chaining (e.g. `$form.user.name`).',
        suggestion:
          'Treat every nested property as possibly `undefined`. Use `?.` between segments: `$form.user?.name` instead of `$form.user.name`. The runtime throws if `$form.user` is undefined.',
      });
      chainFlagged = true;
    }
  }

  // R4: reference used as a truthy/falsy boolean. Three sub-patterns, one warning:
  //   (a) the whole expression is a bare reference (`$form.x`)
  //   (b) reference followed by `&&` / `||` / ternary `?` (and not `??` or `?.`)
  //   (c) `&&` / `||` followed by a trailing reference at the end of the expression
  const refOnly = /^\$(?:form|meta|item)(?:\.[\w?]+)*$/;
  const refBeforeBool = /\$(?:form|meta|item)(?:\.[\w?]+)*\s*(?:&&|\|\||\?(?![.?]))/;
  const refAfterBool = /(?:&&|\|\|)\s*\$(?:form|meta|item)(?:\.[\w?]+)*\s*$/;
  if (refOnly.test(trimmed) || refBeforeBool.test(trimmed) || refAfterBool.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message:
        'Expression uses `$form`/`$meta` directly as a boolean (relies on truthy/falsy coercion).',
      suggestion:
        'Form data values can be `undefined`. Compare explicitly: `$form.x !== undefined`, `$form.x === "value"`, `$form.items?.length > 0`. For default values use nullish coalescing: `$form.x ?? defaultValue`.',
    });
  }

  // R5: comparison (`<`, `>`, `<=`, `>=`) or arithmetic (`+`, `-`, `*`, `/`, `%`) applied to a
  // `$form`/`$meta` reference whose leaf may be `undefined`. Strict equality
  // (`===` / `!==`) and nullish coalescing (`??`) are NOT flagged — they evaluate correctly
  // when the value is undefined.
  //
  // Heuristic to avoid over-firing on guarded code: if a `&&` or `||` appears anywhere before
  // the unsafe operator, assume the LHS is the guard (`$form.x !== undefined && $form.x > 180`
  // idiom) and skip. This produces occasional false negatives but no false positives on the
  // common guarding pattern.
  const refForCmpRe = /\$(?:form|meta|item)(?:\.[\w?]+)+/g;
  let r5Flagged = false;
  let cmpMatch: RegExpExecArray | null;
  while ((cmpMatch = refForCmpRe.exec(trimmed)) !== null) {
    const start = cmpMatch.index;
    const end = start + cmpMatch[0].length;
    const before = trimmed.slice(0, start).trimEnd();
    const after = trimmed.slice(end).trimStart();
    const opAfter = /^(?:<=?|>=?|[+\-*/%])(?!=)/.test(after);
    // The `before` segment ends with the operator char if there's an op directly before the ref.
    // `=` never qualifies — that's part of `===` or `!==`.
    const opBefore = /(?<![=!])[<>+\-*/%]$/.test(before);
    if (!(opAfter || opBefore)) continue;
    // Guard heuristic: any boolean operator anywhere before the ref means there's likely a guard.
    if (/&&|\|\|/.test(before)) continue;
    if (!r5Flagged) {
      out.push({
        path,
        expression: expr,
        message:
          'Expression applies a comparison or arithmetic operator to a `$form`/`$meta` reference whose leaf may be `undefined`.',
        suggestion:
          'Guard the value first: `$form.x !== undefined && $form.x > 180`. Or default it: `($form.x ?? 0) > 180`. Strict equality (`$form.x === 180`) is also safe since it evaluates to `false` when undefined.',
      });
      r5Flagged = true;
    }
  }
}
