import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/number.schema.json';

describe('Number schema validation', () => {
  let ajv: Ajv2020;
  let validate: GetSchema;

  beforeEach(() => {
    ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      verbose: true,
    });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) {
      throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
    }
  });

  describe('Valid configurations', () => {
    it('should validate a minimum valid number definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'num-1',
            path: 'age',
            kind: 'input',
            type: 'number',
            props: {},
          },
        ],
      });

      const validNumber = formDef.form.children[0];
      const isValid = validate(validNumber);
      if (!isValid) {
        specValidationErrorsLogger(validate, validNumber);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'num-1',
            path: 'age',
            kind: 'input',
            type: 'number',
            props: {
              hint: 'Enter your age',
              placeholder: 'e.g. 25',
              step: 1,
              minimum: 0,
              maximum: 120,
              autoGrow: true,
            },
          },
        ],
      });

      const validNumber = formDef.form.children[0];
      const isValid = validate(validNumber);
      if (!isValid) {
        specValidationErrorsLogger(validate, validNumber);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'num-1',
            path: 'age',
            kind: 'input',
            type: 'number',
            props: {
              'hint.hasError': 'Age is required',
              'minimum.isAdmin': -1,
            },
          },
        ],
      });

      const stateScopedNumber = formDef.form.children[0];
      const isValid = validate(stateScopedNumber);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedNumber);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'num-1',
            path: 'age',
            kind: 'input',
            type: 'number',
            props: {
              hint: { key: 'num.hint', default: 'Hint' },
              placeholder: { key: 'num.ph', default: 'Placeholder' },
            },
          },
        ],
      });

      const i18nNumber = formDef.form.children[0];
      const isValid = validate(i18nNumber);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nNumber);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid type for step', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, step should be a number
          {
            uid: 'num-1',
            path: 'age',
            kind: 'input',
            type: 'number',
            props: {
              step: 'one',
            },
          },
        ],
      });

      const invalidNumber = formDef.form.children[0];
      const isValid = validate(invalidNumber);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/step'),
      ).toBe(true);
    });
  });
});
