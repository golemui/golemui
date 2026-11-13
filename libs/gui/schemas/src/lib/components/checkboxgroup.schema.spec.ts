import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/checkboxgroup.schema.json';

describe('CheckboxGroup schema validation', () => {
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
    it('should validate a minimum valid checkbox group definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'toppings',
            kind: 'input',
            type: 'checkboxGroup',
            props: { options: ['Cheese', 'Ham'] },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });

    it('should validate all valid properties, a default value and an array validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'toppings',
            kind: 'input',
            type: 'checkboxGroup',
            label: 'Toppings',
            defaultValue: ['cheese', 2],
            validator: { type: 'array', required: true, minItems: 1, maxItems: 2 },
            props: {
              hint: { key: 'pickAny' },
              options: [
                { name: 'Cheese', id: 'cheese' },
                { name: 'Two', id: 2 },
              ],
              labelField: 'name',
              valueField: 'id',
              direction: 'row',
              'direction.isCompact': 'column',
            },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on a default value that is not a list, and on an unknown direction', () => {
      expect(
        validate({
          path: 'toppings',
          kind: 'input',
          type: 'checkboxGroup',
          defaultValue: 'cheese',
          props: {},
        }),
      ).toBe(false);
      expect(
        validate({
          path: 'toppings',
          kind: 'input',
          type: 'checkboxGroup',
          props: { direction: 'grid' },
        }),
      ).toBe(false);
    });

    it('should fail on a radio group prop it does not take', () => {
      expect(
        validate({
          path: 'toppings',
          kind: 'input',
          type: 'checkboxGroup',
          props: { appearance: 'segmented' },
        }),
      ).toBe(false);
    });
  });
});
