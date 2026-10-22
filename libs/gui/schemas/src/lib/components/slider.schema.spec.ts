import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/slider.schema.json';

describe('Slider schema validation', () => {
  let validate: GetSchema;

  beforeEach(() => {
    const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) {
      throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
    }
  });

  const isValid = (widget: unknown) => {
    const valid = validate(widget);
    if (!valid) specValidationErrorsLogger(validate, widget);
    return valid;
  };

  describe('Valid configurations', () => {
    it('should validate a minimum valid slider definition', () => {
      const formDef = golemForm().create({
        form: [{ path: 'volume', kind: 'input', type: 'slider', props: {} }],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });

    it('should validate all valid properties, a default value and a number validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'volume',
            kind: 'input',
            type: 'slider',
            label: 'Volume',
            defaultValue: 40,
            validator: { type: 'number', required: true, minimum: 10 },
            props: {
              hint: 'Speaker output',
              minimum: 0,
              maximum: 1,
              step: 0.05,
              marks: [0, { value: 0.5, label: 'Half' }, { value: 1, label: { key: 'full' } }],
              format: { style: 'percent', maximumFractionDigits: 0 },
              valuePlacement: 'both',
            },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });

    it('should validate marks: true and state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'volume',
            kind: 'input',
            type: 'slider',
            props: { marks: true, 'valuePlacement.isCompact': 'bubble', 'maximum.isAdmin': 200 },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on an unknown value placement', () => {
      expect(
        validate({
          path: 'volume',
          kind: 'input',
          type: 'slider',
          props: { valuePlacement: 'none' },
        }),
      ).toBe(false);
      expect(validate.errors?.some((e) => e.instancePath === '/props/valuePlacement')).toBe(true);
    });

    it('should fail on a mark without a value, and on format options it does not take', () => {
      expect(
        validate({
          path: 'volume',
          kind: 'input',
          type: 'slider',
          props: { marks: [{ label: 'Loud' }] },
        }),
      ).toBe(false);
      expect(
        validate({
          path: 'volume',
          kind: 'input',
          type: 'slider',
          props: { format: { notation: 'compact' } },
        }),
      ).toBe(false);
    });

    it('should fail on a default value that is not a number, and on a zero step', () => {
      expect(
        validate({ path: 'volume', kind: 'input', type: 'slider', defaultValue: '40', props: {} }),
      ).toBe(false);
      expect(validate({ path: 'volume', kind: 'input', type: 'slider', props: { step: 0 } })).toBe(
        false,
      );
    });
  });
});
