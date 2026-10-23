import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/otp.schema.json';

describe('OTP schema validation', () => {
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
    it('should validate a minimum valid otp definition', () => {
      const formDef = golemForm().create({
        form: [{ path: 'code', kind: 'input', type: 'otp', props: {} }],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });

    it('should validate all valid properties, a default value and a string validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'code',
            kind: 'input',
            type: 'otp',
            label: 'Verification code',
            defaultValue: '123',
            validator: {
              type: 'string',
              required: true,
              exactLength: 8,
              messages: { exactLength: { key: 'otp.incomplete' } },
            },
            props: {
              hint: 'We sent it to your phone',
              groups: [4, 4],
            },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'code',
            kind: 'input',
            type: 'otp',
            props: { 'groups.isLong': [4, 4], 'hint.isLong': 'Eight digits' },
          },
        ],
      });

      expect(isValid(formDef.form.children[0])).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on groups that are not a list of positive integers', () => {
      for (const groups of ['3,3', [], [3, 0]]) {
        expect(validate({ path: 'code', kind: 'input', type: 'otp', props: { groups } })).toBe(
          false,
        );
      }
    });

    it('should fail on a default value that is not digits', () => {
      expect(
        validate({ path: 'code', kind: 'input', type: 'otp', defaultValue: 123456, props: {} }),
      ).toBe(false);
      expect(
        validate({ path: 'code', kind: 'input', type: 'otp', defaultValue: '12-34', props: {} }),
      ).toBe(false);
    });

    it('should fail on a prop it does not take', () => {
      // The code's length is the validator's exactLength.
      for (const props of [
        { mode: 'alphanumeric' },
        { length: 6 },
        { incompleteMessage: 'Enter' },
      ]) {
        expect(validate({ path: 'code', kind: 'input', type: 'otp', props })).toBe(false);
      }
    });
  });
});
