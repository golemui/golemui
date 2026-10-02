import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COMPONENT_SCHEMAS } from './schemas/index';
import { validateFormDefinition } from './validate-form-definition';

// Each group is one file with the full `validateFormDefinition` result per case. To record
// intended changes, run the gui-mcp vite:test target with `-u`. The validators behind this tool
// must keep producing these exact results, whatever way they are built.
const GOLDENS_DIRECTORY = fileURLToPath(new URL('./goldens/validate', import.meta.url));
const CONVERTER_GOLDENS_DIRECTORY = fileURLToPath(new URL('./goldens', import.meta.url));
const MOCKS_DIRECTORY = fileURLToPath(
  new URL('../../../../../apps/apps-shared/src/lib/mocks', import.meta.url),
);

// Same serialization as the other goldens, so a diff reads the same way.
function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function validateAll(inputsByName: Record<string, unknown>): Record<string, unknown> {
  const resultsByName: Record<string, unknown> = {};
  for (const [name, formDefinition] of Object.entries(inputsByName)) {
    resultsByName[name] = {
      input: formDefinition,
      result: validateFormDefinition({ formDefinition }),
    };
  }
  return resultsByName;
}

// Large valid forms are read from their own files, so only the result is recorded.
function validateAllFromFiles(formDefinitionsByName: Record<string, unknown>) {
  const resultsByName: Record<string, unknown> = {};
  for (const [name, formDefinition] of Object.entries(formDefinitionsByName)) {
    resultsByName[name] = validateFormDefinition({ formDefinition });
  }
  return resultsByName;
}

function readMockForms(): Record<string, unknown> {
  const forms: Record<string, unknown> = {};
  const fileNames = readdirSync(MOCKS_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.form.json'))
    .sort();
  for (const fileName of fileNames) {
    forms[fileName] = JSON.parse(readFileSync(join(MOCKS_DIRECTORY, fileName), 'utf8'));
  }
  return forms;
}

function readConverterOutputForms(): Record<string, unknown> {
  const forms: Record<string, unknown> = {};
  for (const subdirectory of ['json-schema', 'openapi']) {
    const directory = join(CONVERTER_GOLDENS_DIRECTORY, subdirectory);
    const fileNames = readdirSync(directory)
      .filter((fileName) => fileName.endsWith('.output.json'))
      .sort();
    for (const fileName of fileNames) {
      const output = JSON.parse(readFileSync(join(directory, fileName), 'utf8')) as Partial<
        Record<'formDefinition', unknown>
      >;
      // Failed conversions have no form definition to validate.
      if (output.formDefinition !== undefined) {
        forms[`${subdirectory}/${fileName}`] = output.formDefinition;
      }
    }
  }
  return forms;
}

function kindOf(widgetType: string): string | undefined {
  const properties = COMPONENT_SCHEMAS[widgetType]?.properties as
    | Record<string, { const?: string }>
    | undefined;
  return properties?.['kind']?.const;
}

// Built from the component schemas so every widget type reaches its own shallow validator.
function widgetCases(
  buildWidget: (widgetType: string, kind: string | undefined) => Record<string, unknown>,
): Record<string, unknown> {
  const inputsByName: Record<string, unknown> = {};
  for (const widgetType of Object.keys(COMPONENT_SCHEMAS).sort()) {
    inputsByName[widgetType] = { form: [buildWidget(widgetType, kindOf(widgetType))] };
  }
  return inputsByName;
}

const VALIDATOR_BRANCH_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'array',
  'file',
  'files',
  'custom',
];

function textInputWithValidator(validator: unknown, key = 'validator') {
  return {
    form: [{ kind: 'input', type: 'textinput', path: 'field', [key]: validator }],
  };
}

function validatorCases(): Record<string, unknown> {
  const inputsByName: Record<string, unknown> = {};
  for (const validatorType of VALIDATOR_BRANCH_TYPES) {
    inputsByName[`${validatorType}/unknown-keyword`] = textInputWithValidator({
      type: validatorType,
      notAKeyword: 1,
    });
    inputsByName[`${validatorType}/wrong-required-type`] = textInputWithValidator({
      type: validatorType,
      required: 'yes',
    });
  }
  inputsByName['type-is-a-typo'] = textInputWithValidator({ type: 'strin' });
  inputsByName['type-is-unknown'] = textInputWithValidator({ type: 'zzzzzzzz' });
  inputsByName['format-is-a-typo'] = textInputWithValidator({ type: 'string', format: 'mail' });
  inputsByName['bad-length'] = textInputWithValidator({ type: 'string', minLength: 'ten' });
  inputsByName['state-scoped-bad-keyword'] = textInputWithValidator(
    { type: 'string', minLength: 'ten' },
    'validator.register',
  );
  inputsByName['two-validators-invalid'] = {
    form: [
      {
        kind: 'input',
        type: 'textinput',
        path: 'field',
        validator: { type: 'string', maxLength: 'x' },
        'validator.edit': { type: 'number', minimum: 'y' },
      },
    ],
  };
  return inputsByName;
}

function customWidgetCases(): Record<string, unknown> {
  return {
    'input/valid': { form: [{ kind: 'input', type: 'myInput', path: 'field' }] },
    'input/missing-path': { form: [{ kind: 'input', type: 'myInput' }] },
    'input/unknown-property': {
      form: [{ kind: 'input', type: 'myInput', path: 'field', notAProperty: true }],
    },
    'input/bad-validator': {
      form: [
        {
          kind: 'input',
          type: 'myInput',
          path: 'field',
          validator: { type: 'string', minLength: 'ten' },
        },
      ],
    },
    'display/valid': { form: [{ kind: 'display', type: 'myDisplay' }] },
    'display/unknown-property': {
      form: [{ kind: 'display', type: 'myDisplay', notAProperty: true }],
    },
    'action/valid': { form: [{ kind: 'action', type: 'myAction' }] },
    'action/unknown-property': {
      form: [{ kind: 'action', type: 'myAction', notAProperty: true }],
    },
    'layout/valid': {
      form: [
        {
          kind: 'layout',
          type: 'myLayout',
          children: [{ kind: 'input', type: 'textinput', path: 'field' }],
        },
      ],
    },
    'layout/empty-children': { form: [{ kind: 'layout', type: 'myLayout', children: [] }] },
    'layout/missing-children': { form: [{ kind: 'layout', type: 'myLayout' }] },
    'layout/children-not-an-array': {
      form: [{ kind: 'layout', type: 'myLayout', children: 'x' }],
    },
    'layout/wraps-an-invalid-builtin': {
      form: [
        {
          kind: 'layout',
          type: 'myLayout',
          children: [{ kind: 'input', type: 'textinput', path: 'field', notAProperty: true }],
        },
      ],
    },
    'kind-is-not-allowed': { form: [{ kind: 'weird', type: 'myWidget' }] },
    'kind-is-missing': { form: [{ type: 'myWidget' }] },
    'type-is-missing': { form: [{ kind: 'input', path: 'field' }] },
    'renderer-without-a-schema': { form: [{ kind: 'display', type: 'renderer' }] },
    'type-is-a-typo': { form: [{ kind: 'input', type: 'textimput', path: 'field' }] },
  };
}

function nestedAndChunkCases(): Record<string, unknown> {
  return {
    'chunk-ref/valid': { form: [{ $ref: './address.form-chunk.json' }] },
    'chunk-ref/not-a-string': { form: [{ $ref: 5 }] },
    'chunk-ref/json-extension': { form: [{ $ref: './address.json' }] },
    'chunk-ref/inside-children': {
      form: [
        {
          kind: 'layout',
          type: 'grid',
          children: [{ $ref: './address.form-chunk.json' }, { $ref: 5 }],
        },
      ],
    },
    'grid/invalid-child': {
      form: [
        {
          kind: 'layout',
          type: 'grid',
          children: [{ kind: 'input', type: 'textinput', path: 'field', notAProperty: true }],
        },
      ],
    },
    'grid/invalid-grandchild': {
      form: [
        {
          kind: 'layout',
          type: 'grid',
          children: [
            {
              kind: 'layout',
              type: 'flex',
              children: [{ kind: 'input', type: 'checkbox', path: 'field', notAProperty: true }],
            },
          ],
        },
      ],
    },
    'repeater/invalid-template': {
      form: [
        {
          kind: 'input',
          type: 'repeater',
          path: 'items',
          props: {
            template: { kind: 'input', type: 'textinput', path: 'name', notAProperty: true },
          },
        },
      ],
    },
    'form/is-empty-object': {},
    'form/is-not-an-array': { form: 'x' },
    'form/states-is-not-an-object': { form: [], states: 5 },
    'form/entry-is-not-an-object': { form: ['x', 5, null] },
    'form/valid-with-states': {
      states: { agreed: '$form.terms === true' },
      form: [{ kind: 'input', type: 'checkbox', path: 'terms', label: 'Accept' }],
    },
  };
}

async function expectGolden(fileName: string, value: unknown): Promise<void> {
  await expect(serialize(value)).toMatchFileSnapshot(join(GOLDENS_DIRECTORY, fileName));
}

describe('validate_form_definition goldens', () => {
  it('matches the recorded results for the apps-shared mock forms', async () => {
    await expectGolden('valid-mocks.json', validateAllFromFiles(readMockForms()));
  });

  it('matches the recorded results for the JSON Schema and OpenAPI converter outputs', async () => {
    await expectGolden('converter-outputs.json', validateAllFromFiles(readConverterOutputForms()));
  });

  it('matches the recorded results for an unknown property on every widget type', async () => {
    const cases = widgetCases((widgetType, kind) => ({
      kind,
      type: widgetType,
      ...(kind === 'input' ? { path: 'field' } : {}),
      notAProperty: true,
    }));
    await expectGolden('widget-unknown-property.json', validateAll(cases));
  });

  it('matches the recorded results for a widget with only a type, for every widget type', async () => {
    const cases = widgetCases((widgetType) => ({ type: widgetType }));
    await expectGolden('widget-missing-required.json', validateAll(cases));
  });

  it('matches the recorded results for a wrong value type on every widget type', async () => {
    const cases = widgetCases((widgetType, kind) => ({
      kind,
      type: widgetType,
      path: 'field',
      label: 5,
      props: 'not an object',
    }));
    await expectGolden('widget-wrong-value-type.json', validateAll(cases));
  });

  it('matches the recorded results for every validator type and validator mistake', async () => {
    await expectGolden('validators.json', validateAll(validatorCases()));
  });

  it('matches the recorded results for custom widgets of every kind', async () => {
    await expectGolden('custom-widgets.json', validateAll(customWidgetCases()));
  });

  it('matches the recorded results for chunk refs, nested widgets, and form level errors', async () => {
    await expectGolden('nested-chunk-and-form.json', validateAll(nestedAndChunkCases()));
  });
});

// Guards the corpus itself: a group that silently shrinks would make the goldens prove less.
describe('validate_form_definition goldens corpus', () => {
  it('reaches every component schema', () => {
    expect(Object.keys(widgetCases(() => ({}))).length).toBe(Object.keys(COMPONENT_SCHEMAS).length);
  });

  it('has at least one converter output and one mock form', () => {
    expect(Object.keys(readConverterOutputForms()).length).toBeGreaterThan(0);
    expect(Object.keys(readMockForms()).length).toBeGreaterThan(0);
  });
});
