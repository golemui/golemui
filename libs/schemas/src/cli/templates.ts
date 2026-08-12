/**
 * Starter files written by `init`. These are the implementer's to edit, unlike the
 * files the generator writes on every run. The JSON templates carry `__IMPLEMENTATION__`
 * and `__ID_BASE__` placeholders that are substituted as they are written.
 */
import exampleFormTemplate from './templates/example.form.json';
import exampleInputTemplate from './templates/example-input.schema.json';
import flexTemplate from './templates/flex.schema.json';
import validatorsTemplate from './templates/validators.schema.json';
import type { SchemaObject } from '../lib/generator/builders.js';

/** The values substituted into every starter file. */
export interface TemplateTokens {
  /** Implementation name, e.g. `kendo`. */
  readonly implementation: string;
  /** Absolute base URL of the schema tree, with a trailing slash. */
  readonly idBase: string;
}

/** Widget type of the example input, derived so the templates and the manifest agree. */
export function exampleInputWidgetType(implementation: string): string {
  return `${implementation}-input`;
}

function substitute(text: string, tokens: TemplateTokens): string {
  const substituted = text
    .replace(/__IMPLEMENTATION__/g, tokens.implementation)
    .replace(/__ID_BASE__/g, tokens.idBase);
  const leftover = substituted.match(/__[A-Z_]+__/);
  if (leftover !== null) {
    throw new Error(`Unsubstituted placeholder ${leftover[0]} in a starter template.`);
  }
  return substituted;
}

function renderJson(template: unknown, tokens: TemplateTokens): string {
  return substitute(JSON.stringify(template, null, 2), tokens) + '\n';
}

/**
 * Renders every starter file.
 * @param tokens - Implementation name and id base, from `init`'s flags or prompts.
 * @returns File contents keyed by path relative to the package directory.
 */
export function starterFiles(tokens: TemplateTokens): Record<string, string> {
  return {
    'schemas.config.mjs': schemasConfigSource(tokens),
    'src/lib/validators.schema.json': renderJson(validatorsTemplate as SchemaObject, tokens),
    'src/lib/components/flex.schema.json': renderJson(flexTemplate as SchemaObject, tokens),
    'src/lib/components/example-input.schema.json': renderJson(
      exampleInputTemplate as SchemaObject,
      tokens,
    ),
    'examples/example.form.json': renderJson(exampleFormTemplate, tokens),
    'test/schemas.spec.ts': schemasSpecSource(tokens),
  };
}

function schemasConfigSource(tokens: TemplateTokens): string {
  return `// The manifest and configuration for this implementation's JSON schema tree.
// You own this file. Every file marked GENERATED is rebuilt from it by
// \`npx @golemui/schemas generate\`, so add a widget by writing its component schema
// under src/lib/components/ and listing it in \`manifest\` below.

/** @type {import('@golemui/schemas').ImplementationSchemaConfig} */
export default {
  implementation: '${tokens.implementation}',
  // Where the tree is published. It only has to be a URL you control: the $ids must be
  // unique and stable, and nothing downloads them (editors read form.editor.schema.json).
  idBase: '${tokens.idBase}',
  generatorPath: '@golemui/schemas generate',
  manifestPath: 'schemas.config.mjs',
  regenerateCommand: 'npx @golemui/schemas generate',
  formTitle: '${tokens.implementation} form DSL',
  statesDescription:
    'Named boolean conditions keyed by state name, each mapping to a reactive expression. ' +
    'Root-level widget props such as \`label\`, \`disabled\`, \`readonly\` and \`validator\` accept ' +
    'a \`.stateName\` suffix, as does any key inside \`props\`.',
  // One entry per widget type. \`flex\` and \`repeater\` are reserved names: use them for
  // your layout and repeat widgets, and do not give another widget those types.
  manifest: [
    { type: 'flex', schemaFile: 'flex.schema.json', kind: 'layout' },
    {
      type: '${exampleInputWidgetType(tokens.implementation)}',
      schemaFile: 'example-input.schema.json',
      kind: 'input',
    },
  ],
  // Handwritten schemas at the src/lib root, re-exported from the generated index.
  libRootSchemaFiles: ['validators.schema.json'],
  includeSchemalessTypesInKnownWidgetTypes: false,
  includeCustomWidgetFallback: false,
  emitEditorBundle: true,
};
`;
}

function schemasSpecSource(tokens: TemplateTokens): string {
  return `// Registers the whole schema tree into one Ajv 2020 instance and validates the
// example form against it. Run it after every \`npx @golemui/schemas generate\`.
//
// Needs \`ajv\` and a test runner. This file is written for vitest, the assertions are
// the only part to change for another runner.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_SCHEMAS_BY_TYPE,
  commonSchema,
  formSchema,
  layoutWidgetSchema,
  validatorsSchema,
  widgetsSchema,
} from '../src/index';

const ajv = new Ajv2020({ allErrors: false, strict: false });

// Leaves before aggregates, the form envelope last. Dedupe through \`ajv.schemas\`:
// \`ajv.getSchema\` compiles on lookup and fails while ref targets are unregistered.
const registrationOrder = [
  commonSchema,
  validatorsSchema,
  widgetsSchema,
  layoutWidgetSchema,
  ...Object.values(COMPONENT_SCHEMAS_BY_TYPE),
  formSchema,
];
for (const schema of registrationOrder) {
  const id = schema['$id'] as string;
  if (!ajv.schemas[id]) {
    ajv.addSchema(schema);
  }
}

const validate = ajv.getSchema('${tokens.idBase}form.schema.json');
if (!validate) {
  throw new Error('The form envelope schema did not register.');
}

function loadExampleForm(): { form: Array<Record<string, unknown>> } {
  const path = fileURLToPath(new URL('../examples/example.form.json', import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('${tokens.implementation} schema tree', () => {
  it('validates the example form', () => {
    const valid = validate(loadExampleForm());
    expect(valid, JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it('rejects an unknown widget type', () => {
    const form = loadExampleForm();
    const firstChild = (form.form[0]['children'] as Array<Record<string, unknown>>)[0];
    firstChild['type'] = 'not-a-widget';
    expect(validate(form)).toBe(false);
  });

  it('rejects an unknown validator key', () => {
    const form = loadExampleForm();
    const firstChild = (form.form[0]['children'] as Array<Record<string, unknown>>)[0];
    firstChild['validator'] = { type: 'string', required: true, notAKey: 1 };
    expect(validate(form)).toBe(false);
  });
});
`;
}
