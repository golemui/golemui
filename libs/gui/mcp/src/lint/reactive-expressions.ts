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
  walk(formDefinition, '', findings);
  return findings;
}

function walk(node: unknown, path: string, out: ExpressionFinding[]): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}/${i}`, out));
    return;
  }
  const obj = node as Record<string, unknown>;

  // include / exclude objects: { when: '...' } or { in: [...] } / { from: [...] }
  for (const key of ['include', 'exclude']) {
    const child = obj[key];
    if (child && typeof child === 'object' && 'when' in (child as object)) {
      const expr = (child as { when: unknown }).when;
      if (typeof expr === 'string') {
        checkExpression(expr, `${path}/${key}/when`, out);
      }
    }
  }

  // states map: { someState: '...expression...' }
  if (path === '' && obj['states'] && typeof obj['states'] === 'object') {
    for (const [name, expr] of Object.entries(obj['states'] as Record<string, unknown>)) {
      if (typeof expr === 'string') {
        checkExpression(expr, `/states/${name}`, out);
      }
    }
  }

  // Any `*.when` property nested inside boolOrWhen-typed fields (disabled, readonly, etc.)
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'when' in (v as object)) {
      const expr = (v as { when: unknown }).when;
      if (typeof expr === 'string' && k !== 'include' && k !== 'exclude') {
        checkExpression(expr, `${path}/${k}/when`, out);
      }
    }
    if (typeof v === 'object' && v !== null) {
      walk(v, `${path}/${k}`, out);
    }
  }
}

function checkExpression(expr: string, path: string, out: ExpressionFinding[]): void {
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
  if (!/\$form\b|\$meta\b|\$formIsInvalid\b/.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message: 'Expression does not reference `$form`, `$meta`, or `$formIsInvalid`.',
      suggestion:
        'GolemUI expressions read form data via `$form.fieldName`, form metadata via `$meta.key`, or the built-in `$formIsInvalid` boolean. Did you forget the prefix?',
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

  // R2: negation of a `$form`/`$meta` reference (`!$form.x`).
  // The lookbehind/lookahead exclude `!=` and `!==` operators.
  if (/(?<![=!])!\s*\$(?:form|meta)\b/.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message:
        'Expression negates a `$form`/`$meta` reference (relies on truthy/falsy coercion).',
      suggestion:
        'Form data values can be `undefined`. Pick the case you actually mean and write it explicitly — `$form.x === undefined`, `$form.x === null`, `$form.x === 0`, `$form.x === ""` — instead of `!$form.x`.',
    });
  }

  // R3: chained nested-property access without optional chaining.
  // For each `$root.<chain>` match, split the chain on `.` and walk segment pairs.
  // A transition from segments[i] to segments[i+1] is safe iff segments[i] ends with `?`.
  const refChainRe = /\$(?:form|meta)\b((?:\.[\w?]+)*)/g;
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
  const refOnly = /^\$(?:form|meta)(?:\.[\w?]+)*$/;
  const refBeforeBool =
    /\$(?:form|meta)(?:\.[\w?]+)*\s*(?:&&|\|\||\?(?![.?]))/;
  const refAfterBool = /(?:&&|\|\|)\s*\$(?:form|meta)(?:\.[\w?]+)*\s*$/;
  if (
    refOnly.test(trimmed) ||
    refBeforeBool.test(trimmed) ||
    refAfterBool.test(trimmed)
  ) {
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
  const refForCmpRe = /\$(?:form|meta)(?:\.[\w?]+)+/g;
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
