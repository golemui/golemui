import type { JsonSchemaFragment } from '@golemui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildFormSchema, type FormSchema } from './schema';
import { createHarness, signupForm } from './spec-support/harness';
import type { WebmcpOptions } from './types';

const options: WebmcpOptions = { name: 'signup', description: 'Create an account' };

const build = (
  formDef: Record<string, unknown> = signupForm,
  data: Record<string, unknown> = {},
  overrides: Partial<WebmcpOptions> = {},
  harnessOptions: Parameters<typeof createHarness>[2] = {},
): FormSchema => {
  const { context, pluginContext } = createHarness(formDef, data, harnessOptions);
  return buildFormSchema(context.store.getState(), pluginContext, { ...options, ...overrides });
};

const properties = (schema: JsonSchemaFragment) =>
  schema['properties'] as Record<string, JsonSchemaFragment>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildFormSchema', () => {
  it('mirrors the data tree: nested paths become nested objects', () => {
    const { inputSchema } = build();
    const user = properties(inputSchema)['user'];

    expect(inputSchema['type']).toBe('object');
    expect(user['type']).toBe('object');
    expect(properties(user)['email']).toMatchObject({ type: 'string', format: 'email' });
  });

  it('lists required fields on their parent object', () => {
    const { inputSchema } = build();
    expect(properties(inputSchema)['user']['required']).toEqual(['email']);
    expect(inputSchema['required']).toEqual(['plan']);
  });

  it('leaves out sensitive, non-writable and excluded fields, but still describes them', () => {
    const schema = build(signupForm, {}, { exclude: ['seats'] });
    const names = Object.keys(properties(schema.inputSchema));

    expect(names).not.toContain('avatar');
    expect(names).not.toContain('seats');
    expect(Object.keys(properties(properties(schema.inputSchema)['user']))).toEqual(['email']);
    expect(schema.fields.map((field) => field.path)).toContain('user.password');
    expect(schema.fields.find((field) => field.path === 'avatar')?.fillable).toBe(false);
  });

  it('describes a field from its label, the widget set text and its visibility condition', () => {
    const { inputSchema } = build();
    const props = properties(inputSchema);

    expect(properties(props['user'])['email']['description']).toBe('Email. Your work email');
    expect(props['company']['description']).toBe('Company. Shown when $form.registerMode === true');
    // The identity translator returns the key, exactly as the widgets render it without i18n.
    expect(props['plan']['description']).toBe('labels.plan');
  });

  it('translates label translation configs through the form translator', () => {
    const { context, pluginContext } = createHarness(signupForm);
    vi.spyOn(pluginContext.localization, 'translate').mockImplementation(
      (key, _params, fallback) => (key === 'labels.plan' ? 'Tarifa' : (fallback ?? key)),
    );
    const { inputSchema } = buildFormSchema(context.store.getState(), pluginContext, options);
    expect(properties(inputSchema)['plan']['description']).toBe('Tarifa');
  });

  it('expresses labelled choices as oneOf with const and title', () => {
    const { inputSchema } = build();
    expect(properties(inputSchema)['plan']['oneOf']).toEqual([
      { const: 'free', title: 'Free' },
      { const: 'team', title: 'Team plan' },
    ]);
    expect(properties(inputSchema)['plan']['type']).toBeUndefined();
  });

  it('expresses unlabelled choices as an enum, on the items of a multi-value field', () => {
    const formDef = {
      form: [
        {
          kind: 'input',
          type: 'multiSelect',
          path: 'colors',
          label: 'Colors',
          props: { options: [{ label: 'red', value: 'red' }, { label: 'blue', value: 'blue' }] },
        },
      ],
    };
    const { inputSchema } = build(formDef);
    expect(properties(inputSchema)['colors']).toMatchObject({
      type: 'array',
      items: { type: ['string', 'number'], enum: ['red', 'blue'] },
    });
  });

  it('reads choices from the calculated widget, so overridden options count', () => {
    const { context, pluginContext } = createHarness(signupForm);
    context.store.dispatch({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'plan', prop: 'options', value: [{ label: 'Enterprise', value: 'ent' }] },
    });
    const { inputSchema } = buildFormSchema(context.store.getState(), pluginContext, options);
    expect(properties(inputSchema)['plan']['oneOf']).toEqual([{ const: 'ent', title: 'Enterprise' }]);
  });

  it('builds repeater rows from the template, with paths relative to the row', () => {
    const schema = build();
    const members = properties(schema.inputSchema)['members'];

    expect(members['type']).toBe('array');
    expect(members['items']).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name' },
        age: { type: 'number', description: 'Age' },
      },
      required: ['name'],
    });
    const entry = schema.fields.find((field) => field.path === 'members');
    expect(entry?.children?.map((child) => child.path)).toEqual(['name', 'age']);
  });

  it('merges the validator keywords over the widget set schema', () => {
    const { inputSchema } = build();
    expect(properties(inputSchema)['seats']).toMatchObject({ type: 'number', minimum: 1 });
  });

  it('describes hidden fields from their authored definition', () => {
    const schema = build(signupForm, { registerMode: false });
    const company = schema.fields.find((field) => field.path === 'company');
    expect(company).toBeDefined();
    expect(properties(schema.inputSchema)['company']).toMatchObject({ type: 'string' });
  });

  it('lets the fields option override the widget set and describe unknown types', () => {
    const formDef = {
      form: [
        { kind: 'input', type: 'customdate', path: 'when', label: 'When' },
        { kind: 'input', type: 'textinput', path: 'note', label: 'Note' },
      ],
    };
    const schema = build(formDef, {}, {
      fields: {
        customdate: { schema: { type: 'string', format: 'date' } },
        textinput: (widget) => ({ schema: { type: 'string', maxLength: widget.path.length } }),
      },
    });
    expect(properties(schema.inputSchema)['when']).toMatchObject({ type: 'string', format: 'date' });
    expect(properties(schema.inputSchema)['note']).toMatchObject({ type: 'string', maxLength: 4 });
    expect(schema.inferredTypes).toEqual([]);
  });

  it('infers unknown types from the validator, then the value, and reports them', () => {
    const formDef = {
      form: [
        { kind: 'input', type: 'a', path: 'a', label: 'A', validator: { type: 'integer' } },
        { kind: 'input', type: 'b', path: 'b', label: 'B' },
        { kind: 'input', type: 'c', path: 'c', label: 'C', defaultValue: true },
        { kind: 'input', type: 'd', path: 'd', label: 'D' },
      ],
    };
    const schema = build(formDef, { b: 'text' });
    const props = properties(schema.inputSchema);

    expect(props['a']).toMatchObject({ type: 'integer' });
    expect(props['b']).toMatchObject({ type: 'string' });
    expect(props['c']).toMatchObject({ type: 'boolean' });
    expect(props['d']['type']).toBeUndefined();
    expect(schema.inferredTypes).toEqual(['a', 'b', 'c', 'd']);
  });

  it('works without a widget set resolver, reading JSON-Schema-named validator types', () => {
    const schema = build(
      { form: [{ kind: 'input', type: 'textinput', path: 'x', label: 'X', validator: { type: 'string', required: true } }] },
      {},
      {},
      { valueSchemas: null },
    );
    expect(properties(schema.inputSchema)['x']).toMatchObject({ type: 'string' });
    expect(schema.inputSchema['required']).toEqual(['x']);
  });

  it('truncates a long field description to 150 characters', () => {
    const label = 'L'.repeat(200);
    const schema = build({ form: [{ kind: 'input', type: 'textinput', path: 'x', label }] });
    const description = properties(schema.inputSchema)['x']['description'] as string;
    expect(description.length).toBe(150);
    expect(description.endsWith('…')).toBe(true);
  });

  it('warns once the serialized schema grows past the soft cap', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const form = Array.from({ length: 400 }, (_, index) => ({
      kind: 'input',
      type: 'textinput',
      path: `field${index}`,
      label: `Field number ${index} with a long label that pushes the size up`,
    }));
    build({ form });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
