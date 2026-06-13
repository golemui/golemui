export type InterpolationFinding = {
  path: string;
  slot: string;
  message: string;
  suggestion?: string;
};

/**
 * Lints `{{...}}` string interpolation templates inside a form definition without executing them.
 * Catches mistakes that are obvious from the syntax:
 *   - empty slots
 *   - slots with no scope reference ($form, $meta, $errors, $formIsInvalid)
 *   - unbalanced `{{` / `}}` delimiters
 *   - assignment operator inside a slot (likely meant `===`)
 *   - nested `{{` inside a slot (copy-paste error)
 */
export function lintStringInterpolations(formDefinition: unknown): InterpolationFinding[] {
  const findings: InterpolationFinding[] = [];
  walk(formDefinition, '', findings);
  return findings;
}

const SLOT_REGEX = /\{\{([^}]*(?:\}[^}]+)*)\}\}/g;

function walk(node: unknown, path: string, out: InterpolationFinding[]): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}/${i}`, out));
    return;
  }
  const obj = node as Record<string, unknown>;
  const isTranslationConfig =
    typeof obj['key'] === 'string' &&
    obj['params'] !== null &&
    typeof obj['params'] === 'object' &&
    !Array.isArray(obj['params']);
  if (isTranslationConfig) {
    const params = obj['params'] as Record<string, unknown>;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      if (typeof paramValue === 'string') {
        checkParamExpression(paramValue, `${path}/params/${paramKey}`, out);
      }
    }
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'params' && isTranslationConfig) {
      continue;
    }
    if (key === 'defaultValue' || key.startsWith('defaultValue.')) {
      continue;
    }
    const childPath = `${path}/${key}`;
    if (typeof value === 'string') {
      checkTemplate(value, childPath, out);
    } else {
      walk(value, childPath, out);
    }
  }
}

function checkParamExpression(value: string, path: string, out: InterpolationFinding[]): void {
  if (value.includes('{{') || value.includes('}}')) {
    out.push({
      path,
      slot: value,
      message: 'i18n param expression should not use `{{` / `}}` delimiters.',
      suggestion: 'Use a bare expression: `"$form.fieldName"` not `"{{$form.fieldName}}"`.',
    });
    return;
  }
  if (value.startsWith('$') && /(?<![=!<>])=(?![=>])/.test(value)) {
    out.push({
      path,
      slot: value,
      message: 'i18n param expression contains a single `=` (assignment).',
      suggestion: 'Param expressions are read-only. Did you mean `===` for equality?',
    });
  }
}

function checkTemplate(value: string, path: string, out: InterpolationFinding[]): void {
  // S3 — unbalanced delimiters: count {{ and }} occurrences
  const openCount = (value.match(/\{\{/g) ?? []).length;
  const closeCount = (value.match(/\}\}/g) ?? []).length;
  if (openCount !== closeCount) {
    out.push({
      path,
      slot: value,
      message: 'String template has unbalanced `{{` / `}}` delimiters.',
      suggestion: 'Every `{{` must have a matching `}}`.',
    });
    return;
  }

  if (openCount === 0) return;

  let match: RegExpExecArray | null;
  SLOT_REGEX.lastIndex = 0;
  while ((match = SLOT_REGEX.exec(value)) !== null) {
    const slot = match[0];
    const expr = match[1];
    checkSlot(expr, slot, path, out);
  }
}

function checkSlot(expr: string, slot: string, path: string, out: InterpolationFinding[]): void {
  const trimmed = expr.trim();

  // S1 — empty slot
  if (!trimmed) {
    out.push({
      path,
      slot,
      message: 'String interpolation slot is empty.',
      suggestion: 'Add an expression, e.g. `{{$form.fieldName}}`.',
    });
    return;
  }

  // S5 — nested {{
  if (trimmed.includes('{{')) {
    out.push({
      path,
      slot,
      message: 'Interpolation slot contains nested `{{`.',
      suggestion: 'Slots cannot be nested. Check for a copy-paste error.',
    });
    return;
  }

  // S2 — missing scope reference
  if (!/\$form\b|\$meta\b|\$errors\b|\$formIsInvalid\b/.test(trimmed)) {
    out.push({
      path,
      slot,
      message:
        'Interpolation slot does not reference `$form`, `$meta`, `$errors`, or `$formIsInvalid`.',
      suggestion:
        'GolemUI template slots read data via `$form.fieldName`, metadata via `$meta.key`, validation errors via `$errors.fieldName`, or the built-in `$formIsInvalid` boolean.',
    });
  }

  // S4 — assignment operator
  if (/(?<![=!<>])=(?![=>])/.test(trimmed)) {
    out.push({
      path,
      slot,
      message: 'Interpolation slot contains a single `=` (assignment).',
      suggestion: 'Template slots are read-only. Did you mean `===` for equality?',
    });
  }
}
