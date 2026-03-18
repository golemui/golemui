/**
 * Generates a system prompt from the Golem widget catalog.
 *
 * Pipeline:
 *   catalog (Zod schemas) → formatZodType() → TypeScript-like signatures
 *                         → generatePrompt() → system prompt string
 *
 * Output format the LLM is asked to produce: a flat JSON object
 *   { root: string, elements: Record<uid, widget> }
 * Children in layout widgets are arrays of UIDs — no nested objects.
 * This avoids deep nesting (which causes LLM hallucination errors).
 */

import * as z from 'zod';

import { catalog } from './catalog';

// ---------------------------------------------------------------------------
// Zod → TypeScript-style string serializer
// Supports Zod v4 (_def.type) and Zod v3 (_def.typeName).
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatZodType(schema: z.ZodTypeAny): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._def as any;

  // Zod v4 uses `_def.type` (e.g. 'string');
  // Zod v3 uses `_def.typeName` (e.g. 'ZodString'). Normalise to lowercase.
  const type: string =
    def.type ??
    (typeof def.typeName === 'string' ? def.typeName.replace(/^Zod/, '').toLowerCase() : 'any');

  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';

    case 'literal': {
      // v4: def.values is an array  |  v3: def.value is a scalar
      const vals: unknown[] = Array.isArray(def.values) ? def.values : [def.value];
      return vals.map((v) => JSON.stringify(v)).join(' | ');
    }

    case 'enum': {
      // v4: def.entries is { key: value }  |  v3: def.values is string[]
      const vals: string[] = def.entries
        ? Object.values(def.entries as Record<string, string>)
        : (def.values as string[]);
      return vals.map((v) => JSON.stringify(v)).join(' | ');
    }

    case 'union':
      return (def.options as z.ZodTypeAny[]).map(formatZodType).join(' | ');

    case 'optional':
    case 'nullable':
      return formatZodType(def.innerType as z.ZodTypeAny);

    case 'array':
      // v4: def.element  |  v3: def.type
      return `${formatZodType((def.element ?? def.type) as z.ZodTypeAny)}[]`;

    case 'object': {
      // v4: def.shape is a plain object  |  v3: def.shape is a getter function
      const shape: Record<string, z.ZodTypeAny> =
        typeof def.shape === 'function' ? def.shape() : def.shape;
      const keys = Object.keys(shape);
      if (keys.length === 0) return '{}';
      const fields = keys.map((k) => {
        const v = shape[k];
        const fieldDefType: string = (v as any)._def?.type ?? (v as any)._def?.typeName ?? '';
        const isOptional =
          fieldDefType === 'optional' || fieldDefType.toLowerCase() === 'zodoptional';
        return `${k}${isOptional ? '?' : ''}: ${formatZodType(v)}`;
      });
      return `{ ${fields.join(', ')} }`;
    }

    default:
      return 'any';
  }
}

// ---------------------------------------------------------------------------
// Catalog → component list section
// ---------------------------------------------------------------------------

function generateComponentsSection(): string {
  const entries = Object.entries(catalog) as [
    keyof typeof catalog,
    (typeof catalog)[keyof typeof catalog],
  ][];

  const lines = entries.map(([name, entry]) => {
    const sig = formatZodType(entry.schema);
    const desc = entry.description ? ` — ${entry.description}` : '';
    return `- ${name}: ${sig}${desc}`;
  });

  return `AVAILABLE WIDGETS (${entries.length}):\n\n${lines.join('\n')}`;
}

// ---------------------------------------------------------------------------
// Full system prompt
// ---------------------------------------------------------------------------

export function generatePrompt(): string {
  return `\
You are a Golem form builder. Given a user request, output a valid Golem form as a single JSON object.

## Output format

Output a single JSON object with this shape:

{
  "root": "<uid of the top-level element>",
  "elements": {
    "<uid>": { <widget object> },
    ...
  }
}

- Every widget must have a globally unique \`uid\` string (e.g. \`"name-input"\`, \`"submit-btn"\`).
- Layout widgets (\`flex\`, \`accordion\`, \`tabs\`) list their children as an array of UIDs: \`"children": ["uid-a", "uid-b"]\`.
  Children are never inlined as objects — always reference them by UID in \`elements\`.
- All input widgets require \`path\`: a dot-separated string binding to the form data field (e.g. \`"user.email"\`).

## Example — simple login form

\`\`\`json
{
  "root": "root",
  "elements": {
    "root":        { "uid": "root",        "kind": "layout", "type": "flex", "children": ["email", "pwd", "submit"] },
    "email":       { "uid": "email",       "kind": "input",  "type": "textinput",  "path": "email",    "label": "Email",    "props": { "placeholder": "you@example.com" } },
    "pwd":         { "uid": "pwd",         "kind": "input",  "type": "password",   "path": "password", "label": "Password" },
    "submit":      { "uid": "submit",      "kind": "action", "type": "button",     "label": "Sign In", "on": { "click": "submit" } }
  }
}
\`\`\`

## Example — conditional field

\`\`\`json
{
  "root": "root",
  "elements": {
    "root":       { "uid": "root",       "kind": "layout", "type": "flex", "children": ["role", "code", "btn"] },
    "role":       { "uid": "role",       "kind": "input",  "type": "select", "path": "config.user.role", "label": "Role",
                    "props": { "options": [{ "label": "User", "value": "user" }, { "label": "Admin", "value": "admin" }] } },
    "code":       { "uid": "code",       "kind": "input",  "type": "textinput", "path": "adminCode", "label": "Admin Code",
                    "include": { "when": "$form.config?.user?.role === 'admin'" } },
    "btn":        { "uid": "btn",        "kind": "action", "type": "button", "label": "Submit", "on": { "click": "submit" } }
  }
}
\`\`\`

## Key rules

- Always include \`uid\`, \`kind\`, and \`type\` on every widget.
- All \`input\` widgets also require \`path\` (dot notation, e.g. \`"address.city"\`).
- \`disabled\` and \`readonly\` accept a plain boolean.
- \`include\` / \`exclude\` accept \`{ "when": "<expression>" }\` to conditionally show/hide a widget. These expressions can only be placed at the root level of the widget, never inside "props".
- Use \`$form.fieldPath\` in expressions to read sibling field values. Always use optional chaining (\`?.\`) for nested paths (e.g. \`$form.config?.screen\`, never \`$form.config.screen\`).
- When doing comparisons in "include" or "exclude" conditions, always return boolean values (e.g. \`$form.config?.size !== undefined\`, never just \`$form.config?.size\`).
- \`size\` is an optional grid column span (1–12). Omit for full width.
- \`on\` holds event handlers: \`{ "click": "submit" }\`, \`{ "change": "reload" }\`, etc.
- Use \`select\` or \`radiogroup\` for short static option lists (provide \`props.options\`).
- \`alert\` requires \`props.text\`.
- \`button\` is \`kind: "action"\`; all other widgets that collect data are \`kind: "input"\`.
- \`flex\` is the default layout widget. Use \`props.direction\` for rows/columns and \`props.gap\` for spacing.
- \`accordion\` requires \`props.sections\` (array of \`{ label, uid }\`). Each section uid must match a child UID.
- \`tabs\` requires \`props.tabs\` (array of \`{ label, uid }\`). Each tab uid must match a child UID.
- \`repeater\` is \`kind: "input"\`. Its \`props.template\` is the UID of a \`flex\` element that defines the repeatable row layout.

${generateComponentsSection()}
`;
}
