import { describe, expect, it } from 'vitest';
import { generateFromJsonSchema } from './generate-from-json-schema';

describe('generate_from_json_schema', () => {
  it('maps a simple user signup schema to a valid form', () => {
    const result = generateFromJsonSchema({
      jsonSchema: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          age: { type: 'integer', minimum: 13, maximum: 120 },
          newsletter: { type: 'boolean' },
        },
      },
    });

    expect(result.validation.valid).toBe(true);
    expect(result.unmapped).toEqual([]);

    const form = result.formDefinition.form as any[];
    // Inputs + a submit button at the end.
    const submit = form[form.length - 1];
    expect(submit).toMatchObject({ kind: 'action', type: 'button' });

    const email = form[0];
    expect(email).toMatchObject({
      kind: 'input',
      type: 'textinput',
      path: 'email',
      validator: { type: 'string', required: true, format: 'email' },
    });

    const password = form[1];
    expect(password.type).toBe('password');
    expect(password.validator).toMatchObject({ type: 'string', required: true, minLength: 8 });

    const age = form[2];
    expect(age.type).toBe('number');
    expect(age.validator).toMatchObject({ type: 'integer', minimum: 13, maximum: 120 });

    const newsletter = form[3];
    expect(newsletter.type).toBe('checkbox');
  });

  it('maps small enums to select and large enums to dropdown', () => {
    const smallEnum = generateFromJsonSchema({
      jsonSchema: {
        type: 'object',
        properties: { plan: { type: 'string', enum: ['free', 'pro'] } },
      },
      submitAction: false,
    });
    expect((smallEnum.formDefinition.form as any[])[0].type).toBe('select');

    const bigEnum = generateFromJsonSchema({
      jsonSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            enum: ['us', 'ca', 'mx', 'uk', 'fr', 'de', 'es', 'it', 'jp'],
          },
        },
      },
      submitAction: false,
    });
    expect((bigEnum.formDefinition.form as any[])[0].type).toBe('dropdown');
    expect(bigEnum.validation.valid).toBe(true);
  });

  it('maps a date format to dateInput, date-time to datePicker', () => {
    const r = generateFromJsonSchema({
      jsonSchema: {
        type: 'object',
        properties: {
          birth: { type: 'string', format: 'date' },
          startsAt: { type: 'string', format: 'date-time' },
        },
      },
      submitAction: false,
    });
    expect(r.validation.valid).toBe(true);
    const form = r.formDefinition.form as any[];
    expect(form[0].type).toBe('dateInput');
    expect(form[1].type).toBe('datePicker');
  });

  it('renders nested objects as flex groups', () => {
    const r = generateFromJsonSchema({
      jsonSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            required: ['street'],
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
            },
          },
        },
      },
      submitAction: false,
    });
    expect(r.validation.valid).toBe(true);
    const group = (r.formDefinition.form as any[])[0];
    expect(group.kind).toBe('layout');
    expect(group.type).toBe('flex');
    expect(group.children.length).toBeGreaterThanOrEqual(2);
  });

  it('renders array-of-object as a repeater', () => {
    const r = generateFromJsonSchema({
      jsonSchema: {
        type: 'object',
        properties: {
          addresses: {
            type: 'array',
            items: {
              type: 'object',
              properties: { street: { type: 'string' } },
            },
          },
        },
      },
      submitAction: false,
    });
    expect(r.validation.valid).toBe(true);
    const rep = (r.formDefinition.form as any[])[0];
    expect(rep.type).toBe('repeater');
    expect(rep.props.template.type).toBe('flex');
  });

  it('reports unmapped fields without failing', () => {
    const r = generateFromJsonSchema({
      jsonSchema: {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' } }, // arrays of primitives unsupported
        },
      },
      submitAction: false,
    });
    expect(r.unmapped.length).toBeGreaterThan(0);
    expect(r.validation.valid).toBe(true); // the rest of the form is still valid
  });
});
