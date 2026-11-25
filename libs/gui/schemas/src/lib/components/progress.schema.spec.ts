import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/progress.schema.json';

describe('Progress schema validation', () => {
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
    it('validates a minimal, indeterminate progress', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'display', type: 'progress', props: { label: 'Uploading' } }],
      });
      expectValid(formDef.form.children[0]);
    });

    it('validates a progress with every prop, a state override and a translation key', () => {
      const formDef = golemForm().create({
        states: { step2: '$form.step === 2' },
        form: [
          {
            uid: 'profile',
            kind: 'display',
            type: 'progress',
            props: {
              label: { key: 'profile.progress', default: 'Profile' },
              value: 25,
              max: 100,
              showValue: true,
              'value.step2': 50,
            },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });
  });

  describe('Invalid configurations', () => {
    it('rejects a progress without a label', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "props.label" is missing.
          { kind: 'display', type: 'progress', props: { value: 40 } },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'required',
        params: { missingProperty: 'label' },
      });
    });

    it('rejects a value given as a string', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'progress',
            // @ts-expect-error Expected, value is a number.
            props: { label: 'Profile', value: '40' },
          },
        ],
      });
      expectError(formDef.form.children[0], { keyword: 'type', instancePath: '/props/value' });
    });

    it('rejects a max that is not positive', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'display', type: 'progress', props: { label: 'Profile', max: 0 } }],
      });
      expectError(formDef.form.children[0], {
        keyword: 'exclusiveMinimum',
        instancePath: '/props/max',
      });
    });
  });
});
