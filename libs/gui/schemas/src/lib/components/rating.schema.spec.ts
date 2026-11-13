import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/rating.schema.json';

describe('Rating schema validation', () => {
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
    it('should validate a minimum valid rating definition', () => {
      const formDef = golemForm().create({
        form: [{ path: 'service', kind: 'input', type: 'rating', props: {} }],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });

    it('should validate a hint, a default value and an integer validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'service',
            kind: 'input',
            type: 'rating',
            label: 'Service',
            defaultValue: 4,
            validator: { type: 'integer', required: true, maximum: 10 },
            props: { hint: 'How was it?', 'hint.isCompact': { key: 'short' } },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on a default value that is not a whole number from 1', () => {
      for (const defaultValue of ['4', 3.5, 0]) {
        expect(
          validate({ path: 'service', kind: 'input', type: 'rating', defaultValue, props: {} }),
          String(defaultValue),
        ).toBe(false);
      }
    });

    it('should fail on a max prop: the stars are the validator maximum', () => {
      expect(validate({ path: 'service', kind: 'input', type: 'rating', props: { max: 10 } })).toBe(
        false,
      );
    });
  });
});
