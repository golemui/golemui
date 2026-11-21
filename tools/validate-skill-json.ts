/**
 * The `json` command of `skillunit.yaml`: validates one JSON example of the agent skill
 * (`skills/golemui`) with the MCP's validator, run from source.
 *
 * Examples are often fragments, and the validator takes a whole definition, so the example is
 * wrapped first:
 * - a definition (an object with `form`) is validated as it is;
 * - one widget (an object with `kind`) becomes `{ "form": [widget] }`;
 * - an array of widgets becomes `{ "form": widgets }`.
 * Anything else is not a form: mark its fence `no-check`, or show it inside a widget.
 *
 * Every finding fails the example, warnings included: an example an agent copies must be
 * clean. A custom widget, which the validator always warns about, belongs in a `no-check` block.
 *
 * Run: npx tsx --tsconfig libs/gui/mcp/tsconfig.json tools/validate-skill-json.ts <file>
 */
import { readFileSync } from 'node:fs';
import { validateFormDefinition } from '../libs/gui/mcp/src/json/validate-form-definition';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isWidget = (value: unknown): boolean => isObject(value) && 'kind' in value;

function toDefinition(example: unknown): Record<string, unknown> | undefined {
  if (isObject(example) && 'form' in example) return example;
  if (isWidget(example)) return { form: [example] };
  if (Array.isArray(example) && example.length > 0 && example.every(isWidget)) {
    return { form: example };
  }
  return undefined;
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: validate-skill-json <file.json>');
  process.exit(2);
}

let example: unknown;
try {
  example = JSON.parse(readFileSync(file, 'utf-8'));
} catch (e) {
  console.error(`Not valid JSON: ${(e as Error).message}`);
  process.exit(1);
}

const formDefinition = toDefinition(example);
if (!formDefinition) {
  console.error(
    'Not a form definition, a widget or an array of widgets. Mark the fence `no-check`, or show the example inside a widget.',
  );
  process.exit(1);
}

const result = validateFormDefinition({ formDefinition });
const findings = [
  ...result.errors,
  ...result.warnings,
  ...result.expressionWarnings,
  ...result.interpolationWarnings,
];
if (findings.length > 0) {
  console.log(JSON.stringify(findings, null, 2));
  process.exit(1);
}
