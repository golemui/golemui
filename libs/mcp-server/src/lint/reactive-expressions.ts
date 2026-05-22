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
  //   $form   — form data
  //   $meta   — user-supplied form metadata (e.g. systemMessage, connectionStatus)
  //   $item   — current item inside a repeater template
  //   $index  — current item index inside a repeater template
  if (!/\$form\b|\$meta\b|\$item\b|\$index\b/.test(trimmed)) {
    out.push({
      path,
      expression: expr,
      message: 'Expression does not reference `$form`, `$meta`, `$item`, or `$index`.',
      suggestion:
        'GolemUI expressions read form data via `$form.fieldName` or form metadata via `$meta.key`. Did you forget the prefix?',
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
}
