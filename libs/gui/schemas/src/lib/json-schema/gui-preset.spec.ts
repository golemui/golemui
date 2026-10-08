import {
  type ConvertOptions,
  type Diagnostic,
  type FormDefinitionJson,
  type FormWidgetJson,
  type JsonSchema,
  fromJsonSchema,
} from '@golemui/schemas/json-schema';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { guiPreset, type GuiPresetOptions } from './gui-preset';

// Fail fast: a oneOf over every widget reports each branch it did not match.
const ajv = new Ajv2020({ allErrors: false, strict: false });
registerGolemSchemas(ajv);
const validateForm = ajv.getSchema('https://golemui.com/schemas/gui/form.schema.json') as GetSchema;

/** Converts with the gui preset and checks that the result is a valid gui form definition. */
const convert = (
  schema: JsonSchema,
  presetOptions: GuiPresetOptions = {},
  options: Partial<ConvertOptions> = {},
) => {
  const result = fromJsonSchema(schema, { preset: guiPreset(presetOptions), ...options });
  const valid = validateForm(result.formDefinition);
  if (!valid) {
    specValidationErrorsLogger(validateForm, result.formDefinition);
  }
  expect(valid).toBe(true);
  return result;
};

/** The widgets without the submit button. */
const formOf = (schema: JsonSchema, presetOptions: GuiPresetOptions = {}) =>
  convert(schema, { submitAction: false, ...presetOptions }).formDefinition.form;

const objectOf = (properties: JsonSchema, extra: JsonSchema = {}): JsonSchema => ({
  type: 'object',
  properties,
  ...extra,
});

const codesOf = (diagnostics: Diagnostic[]) => diagnostics.map((diagnostic) => diagnostic.code);

describe('guiPreset: strings, numbers and booleans', () => {
  it('builds the inputs of a signup form', () => {
    const form = formOf(
      objectOf(
        {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          age: { type: 'integer', minimum: 13 },
          newsletter: { type: 'boolean' },
        },
        { required: ['email', 'password'] },
      ),
    );

    expect(form).toEqual([
      {
        kind: 'input',
        type: 'textinput',
        path: 'email',
        label: 'Email',
        validator: { type: 'string', required: true, format: 'email' },
      },
      {
        kind: 'input',
        type: 'password',
        path: 'password',
        label: 'Password',
        validator: { type: 'string', required: true, minLength: 8 },
      },
      {
        kind: 'input',
        type: 'number',
        path: 'age',
        label: 'Age',
        validator: { type: 'integer', minimum: 13 },
      },
      { kind: 'input', type: 'checkbox', path: 'newsletter', label: 'Newsletter' },
    ]);
  });

  it('takes the hint, placeholder, read-only flag and default from the schema', () => {
    const [name] = formOf(
      objectOf({
        name: {
          type: 'string',
          description: 'As on your passport',
          examples: ['Jane Doe'],
          readOnly: true,
          default: 'Anonymous',
        },
      }),
    );

    expect(name).toEqual({
      kind: 'input',
      type: 'textinput',
      path: 'name',
      label: 'Name',
      readonly: true,
      defaultValue: 'Anonymous',
      props: { hint: 'As on your passport', placeholder: 'Jane Doe' },
    });
  });

  it('takes a default from an enclosing object default', () => {
    const [group] = formOf(
      objectOf({
        address: objectOf({ city: { type: 'string' } }, { default: { city: 'Barcelona' } }),
      }),
    );

    expect(group.children?.[0]['defaultValue']).toBe('Barcelona');
  });

  it.each([
    [{ type: 'string', format: 'password' }, 'password'],
    [{ type: 'string', writeOnly: true }, 'password'],
    [{ type: 'string', contentMediaType: 'text/markdown' }, 'markdown'],
    [{ type: 'string', maxLength: 200 }, 'textarea'],
    [{ type: 'string', maxLength: 199 }, 'textinput'],
    [{ type: 'string', format: 'date' }, 'dateInput'],
    [{ type: 'string', format: 'time' }, 'timeInput'],
    [{ type: 'number' }, 'number'],
  ])('builds %j as %s', (field, type) => {
    expect(formOf(objectOf({ field }))[0].type).toBe(type);
  });

  it('uses a dateTimePicker for date-time and notes that it writes local time', () => {
    const result = convert(objectOf({ startsAt: { type: 'string', format: 'date-time' } }));

    expect(result.formDefinition.form[0].type).toBe('dateTimePicker');
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ severity: 'info', code: 'local-datetime', path: 'startsAt' }),
    ]);
  });

  it('shows a const as a read-only input with its value', () => {
    expect(formOf(objectOf({ version: { type: 'string', const: 'v2' } }))[0]).toEqual({
      kind: 'input',
      type: 'textinput',
      path: 'version',
      label: 'Version',
      readonly: true,
      defaultValue: 'v2',
      validator: { type: 'string', const: 'v2' },
    });
  });

  it('builds a checkbox that must be checked, and starts a required one as false', () => {
    const [terms, subscribed] = formOf(
      objectOf(
        { terms: { type: 'boolean', const: true }, subscribed: { type: 'boolean' } },
        { required: ['subscribed'] },
      ),
    );

    expect(terms['validator']).toEqual({ type: 'boolean', required: true, const: true });
    expect(subscribed['defaultValue']).toBe(false);
  });
});

describe('guiPreset: choices', () => {
  it('builds a select up to 6 options and a dropdown above', () => {
    const small = formOf(objectOf({ plan: { type: 'string', enum: ['free', 'pro_plan'] } }))[0];
    const large = formOf(
      objectOf({ country: { type: 'string', enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] } }),
    )[0];

    expect(small).toEqual({
      kind: 'input',
      type: 'select',
      path: 'plan',
      label: 'Plan',
      validator: { type: 'string', enum: ['free', 'pro_plan'] },
      props: {
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Pro plan', value: 'pro_plan' },
        ],
      },
    });
    expect(large.type).toBe('dropdown');
    expect(large.props).toMatchObject({ labelField: 'label', valueField: 'value' });
    expect(large.props?.['items']).toHaveLength(7);
  });

  it('builds a radiogroup when the radio threshold allows it', () => {
    const [size] = formOf(objectOf({ size: { enum: ['s', 'm', 'l'] } }), {
      enumThresholds: { radio: 3 },
    });

    expect(size.type).toBe('radiogroup');
  });

  it('labels the options of a oneOf of const by title, also for numbers', () => {
    const [rating] = formOf(
      objectOf({
        rating: {
          type: 'integer',
          oneOf: [
            { const: 1, title: 'Bad' },
            { const: 5, title: 'Great' },
          ],
        },
      }),
    );

    expect(rating.type).toBe('select');
    expect(rating.props?.['options']).toEqual([
      { label: 'Bad', value: 1 },
      { label: 'Great', value: 5 },
    ]);
  });

  it('builds a multiList for an array of choices, and a multiDropdown above 6', () => {
    const colors = (count: number) =>
      objectOf({
        colors: {
          type: 'array',
          uniqueItems: true,
          items: { enum: ['red', 'green', 'blue', 'cyan', 'pink', 'gold', 'teal'].slice(0, count) },
        },
      });

    const [few] = formOf(colors(3));
    expect(few).toMatchObject({
      type: 'multiList',
      validator: { type: 'array', uniqueItems: true },
      props: { labelField: 'label', valueField: 'value' },
    });
    expect(formOf(colors(7))[0].type).toBe('multiDropdown');
  });
});

describe('guiPreset: arrays and objects', () => {
  const addresses = {
    type: 'array',
    maxItems: 3,
    items: objectOf(
      { street: { type: 'string' }, city: { type: 'string' } },
      { title: 'Address', required: ['street'] },
    ),
  };

  it('builds a repeater for an array of objects', () => {
    expect(formOf(objectOf({ addresses }, { required: ['addresses'] }))[0]).toEqual({
      kind: 'input',
      type: 'repeater',
      path: 'addresses',
      label: 'Addresses',
      validator: { type: 'array', required: true, maxItems: 3 },
      props: {
        title: 'Address',
        addLabel: 'Add address',
        removeLabel: 'Remove',
        limit: 3,
        template: {
          kind: 'layout',
          type: 'grid',
          props: { gap: 'sm' },
          children: [
            {
              kind: 'input',
              type: 'textinput',
              path: 'addresses.items.street',
              label: 'Street',
              validator: { type: 'string', required: true },
            },
            { kind: 'input', type: 'textinput', path: 'addresses.items.city', label: 'City' },
          ],
        },
      },
    });
  });

  it('builds a repeater on a property named items', () => {
    const [invoice] = formOf(
      objectOf({
        invoice: objectOf({
          items: { type: 'array', items: objectOf({ sku: { type: 'string' } }) },
        }),
      }),
    );
    const repeater = invoice.children?.[0] as FormWidgetJson;

    expect(repeater.path).toBe('invoice.items');
    expect((repeater.props?.['template'] as FormWidgetJson).children?.[0].path).toBe(
      'invoice.items.items.sku',
    );
  });

  it('builds tags for an array of values and reports what tags cannot keep', () => {
    const result = convert(
      objectOf({
        keywords: { type: 'array', items: { type: 'string', maxLength: 10 } },
        scores: { type: 'array', items: { type: 'integer' } },
      }),
      { submitAction: false },
    );

    expect(result.formDefinition.form.map((widget) => widget.type)).toEqual(['tags', 'tags']);
    expect(result.formDefinition.form[0].props).toEqual({ placeholder: 'Add and press Enter' });
    expect(codesOf(result.diagnostics)).toEqual(['item-constraints-dropped', 'item-type-mismatch']);
  });

  it('builds a tuple as a row of inputs at the positions', () => {
    const [point] = formOf(
      objectOf({
        point: {
          type: 'array',
          prefixItems: [{ type: 'number' }, { type: 'number' }],
          items: false,
        },
      }),
    );

    expect(point).toMatchObject({
      kind: 'layout',
      type: 'grid',
      props: { direction: 'row', gap: 'sm' },
    });
    expect(point.children?.map((child) => child.path)).toEqual(['point.0', 'point.1']);
  });

  it('groups a nested object in a grid stack, with its title when asked', () => {
    const schema = objectOf({
      address: objectOf({ city: { type: 'string' } }, { title: 'Address' }),
    });

    expect(formOf(schema)[0]).toEqual({
      kind: 'layout',
      type: 'grid',
      props: { gap: 'sm' },
      children: [{ kind: 'input', type: 'textinput', path: 'address.city', label: 'City' }],
    });
    expect(formOf(schema, { objectTitle: 'markdownText' })[0].children?.[0]).toEqual({
      kind: 'display',
      type: 'markdownText',
      props: { md: '### Address' },
    });
    expect(formOf(schema, { objectTitle: 'alert' })[0].children?.[0]).toEqual({
      kind: 'display',
      type: 'alert',
      props: { text: 'Address', level: 'info' },
    });
  });

  it('leaves out an object or an array whose items have nothing to render', () => {
    const result = convert(
      objectOf({
        empty: objectOf({}),
        rows: { type: 'array', items: objectOf({}) },
        name: { type: 'string' },
      }),
      { submitAction: false },
    );

    expect(result.formDefinition.form.map((widget) => widget.path)).toEqual(['name']);
    expect(codesOf(result.diagnostics)).toEqual(['empty-object', 'empty-object', 'empty-repeater']);
  });
});

describe('guiPreset: root and named widgets', () => {
  const schema = objectOf({ first: { type: 'string' }, last: { type: 'string' } });

  it('adds a submit button with a label', () => {
    const { form } = convert(schema, { submitLabel: 'Create account' }).formDefinition;

    expect(form[2]).toEqual({
      kind: 'action',
      type: 'button',
      actionType: 'submit',
      label: 'Create account',
      props: { variant: 'filled' },
    });
  });

  it.each([
    ['horizontal', 'grid', { direction: 'row', gap: 'sm' }],
    ['grid', 'grid', { columns: 'auto', gap: 'sm' }],
  ] as const)('wraps the form in a %s layout', (rootLayout, type, props) => {
    const { form } = convert(schema, { rootLayout }).formDefinition;

    expect(form).toHaveLength(1);
    expect(form[0]).toMatchObject({ kind: 'layout', type, props });
    expect(form[0].children).toHaveLength(3);
  });

  it('builds the widget an override names', () => {
    const result = convert(
      objectOf({
        subscribed: { type: 'boolean' },
        size: { enum: ['s', 'm'] },
        address: objectOf({ city: { type: 'string' } }),
        bio: { type: 'string' },
      }),
      { submitAction: false },
      {
        overrides: {
          subscribed: { widget: 'toggle' },
          size: { widget: 'radiogroup' },
          address: { widget: 'grid' },
          bio: { widget: 'textarea', props: { autoGrow: true } },
        },
      },
    );

    expect(result.formDefinition.form.map((widget) => widget.type)).toEqual([
      'toggle',
      'radiogroup',
      'grid',
      'textarea',
    ]);
    expect(result.formDefinition.form[3].props).toEqual({ autoGrow: true });
  });

  it('writes the gui form schema URL', () => {
    expect(convert(schema).formDefinition.$schema).toBe(
      'https://golemui.com/schemas/form.schema.json',
    );
  });
});

describe('guiPreset: unions and conditionals produce valid gui forms', () => {
  it('validates a discriminated union and an if/then/else', () => {
    const result: { formDefinition: FormDefinitionJson } = convert(
      objectOf(
        {
          country: { type: 'string', enum: ['US', 'NL'] },
          zip: { type: 'string' },
          payment: {
            oneOf: [
              objectOf(
                { method: { const: 'card' }, cardNumber: { type: 'string' } },
                { required: ['method', 'cardNumber'] },
              ),
              objectOf(
                { method: { const: 'bank' }, iban: { type: 'string' } },
                { required: ['method', 'iban'] },
              ),
            ],
          },
        },
        {
          required: ['country'],
          if: { properties: { country: { const: 'US' } }, required: ['country'] },
          then: { properties: { zip: { pattern: '^[0-9]{5}$' } }, required: ['zip'] },
          else: { properties: { zip: { pattern: '^[0-9]{4}[A-Z]{2}$' } } },
        },
      ),
    );

    expect(result.formDefinition.states).toEqual({
      if01: '$form.country === "US"',
      if02: '!($form.country === "US")',
    });
    expect(result.formDefinition.form[1]).toMatchObject({
      path: 'zip',
      'validator.if01': { type: 'string', required: true, pattern: '^[0-9]{5}$' },
      'validator.if02': { type: 'string', pattern: '^[0-9]{4}[A-Z]{2}$' },
    });
  });
});

describe('guiPreset: repeater add label', () => {
  it.each([
    ['addresses', 'Add address'],
    ['boxes', 'Add box'],
    ['batches', 'Add batch'],
    ['cases', 'Add case'],
    ['sizes', 'Add size'],
    ['categories', 'Add category'],
    ['lineItems', 'Add line item'],
    ['staff', 'Add staff'],
  ])('writes the singular of %s', (name, addLabel) => {
    const [repeater] = formOf(
      objectOf({ [name]: { type: 'array', items: objectOf({ a: { type: 'string' } }) } }),
    );

    expect(repeater.props?.['addLabel']).toBe(addLabel);
  });
});
