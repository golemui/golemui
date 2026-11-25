import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/badge.schema.json';

describe('Badge schema validation', () => {
  let validate: GetSchema;

  beforeEach(() => {
    const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
  });

  const expectValid = (widget: unknown) => {
    const isValid = validate(widget);
    if (!isValid) specValidationErrorsLogger(validate, widget);
    expect(isValid).toBe(true);
  };

  const expectError = (widget: unknown, error: Record<string, unknown>) => {
    expect(validate(widget)).toBe(false);
    expect(validate.errors).toEqual(expect.arrayContaining([expect.objectContaining(error)]));
  };

  describe('Valid configurations', () => {
    it('validates a minimal badge', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'display', type: 'badge', props: { text: 'Paid' } }],
      });
      expectValid(formDef.form.children[0]);
    });

    it('validates a badge with every prop, a state override and a translation key', () => {
      const formDef = golemForm().create({
        states: { overdue: '$form.overdue === true' },
        form: [
          {
            uid: 'status',
            kind: 'display',
            type: 'badge',
            size: 3,
            props: {
              text: { key: 'invoice.paid', default: 'Paid' },
              level: 'success',
              'text.overdue': 'Overdue',
              'level.overdue': 'error',
            },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });
  });

  describe('Invalid configurations', () => {
    it('rejects a badge without text', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "props.text" is missing.
          { kind: 'display', type: 'badge', props: { level: 'info' } },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'required',
        params: { missingProperty: 'text' },
      });
    });

    it('rejects an unknown level', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'badge',
            // @ts-expect-error Expected, invalid value for level.
            props: { text: 'Paid', level: 'danger' },
          },
        ],
      });
      expectError(formDef.form.children[0], { keyword: 'enum', instancePath: '/props/level' });
    });

    it('rejects a badge that is not a display widget', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, kind must be 'display'.
          { kind: 'input', type: 'badge', props: { text: 'Paid' } },
        ],
      });
      expectError(formDef.form.children[0], { schemaPath: '#/properties/kind/const' });
    });

    it('rejects an unknown prop', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'badge',
            // @ts-expect-error Expected, variant is not a prop: the intent is `level`.
            props: { text: 'Paid', variant: 'info' },
          },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'additionalProperties',
        params: { additionalProperty: 'variant' },
      });
    });
  });
});
