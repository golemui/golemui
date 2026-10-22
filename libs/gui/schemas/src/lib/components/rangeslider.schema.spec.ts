import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/rangeslider.schema.json';

describe('Range slider schema validation', () => {
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
    it('should validate a minimum valid range slider definition', () => {
      const formDef = golemForm().create({
        form: [{ path: 'price', kind: 'input', type: 'rangeSlider', props: {} }],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });

    it('should validate all valid properties, a default range and a range validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'price',
            kind: 'input',
            type: 'rangeSlider',
            label: 'Price',
            defaultValue: { start: 100, end: 300 },
            validator: {
              type: 'range',
              required: true,
              messages: { required: { key: 'price.required' }, invalid: 'Pick a valid range' },
            },
            props: {
              hint: 'Per night',
              minimum: 0,
              maximum: 500,
              step: 10,
              marks: true,
              format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
              valuePlacement: 'label',
              startLabel: 'From',
              endLabel: { key: 'price.to', default: 'To' },
            },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on a default range with an end missing, or not a range', () => {
      for (const defaultValue of [{ start: 100 }, [100, 300], 100]) {
        expect(
          validate({ path: 'price', kind: 'input', type: 'rangeSlider', defaultValue, props: {} }),
        ).toBe(false);
      }
    });

    it('should fail on a range validator with rules it does not take', () => {
      expect(
        validate({
          path: 'price',
          kind: 'input',
          type: 'rangeSlider',
          validator: { type: 'range', minimum: 10 },
          props: {},
        }),
      ).toBe(false);
    });
  });
});
