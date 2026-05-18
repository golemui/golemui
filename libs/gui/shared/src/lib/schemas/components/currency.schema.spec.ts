import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/currency.schema.json';

describe('Currency schema validation', () => {
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
    it('should validate a minimum valid currency definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'amount',
            kind: 'input',
            type: 'currency',
            props: {},
          },
        ],
      });

      const validCurrency = formDef.form.children[0];
      const isValid = validate(validCurrency);
      if (!isValid) {
        specValidationErrorsLogger(validate, validCurrency);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'amount',
            kind: 'input',
            type: 'currency',
            props: {
              currency: 'EUR',
              hint: 'Enter amount',
              placeholder: '0.00',
              icon: 'euro',
              step: 10,
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            },
          },
        ],
      });

      const validCurrency = formDef.form.children[0];
      const isValid = validate(validCurrency);
      if (!isValid) {
        specValidationErrorsLogger(validate, validCurrency);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'amount',
            kind: 'input',
            type: 'currency',
            props: {
              currency: 'EUR',
              'hint.hasError': 'Amount required',
              'minimumFractionDigits.isDesktop': 0,
            },
          },
        ],
      });

      const stateScopedCurrency = formDef.form.children[0];
      const isValid = validate(stateScopedCurrency);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedCurrency);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'amount',
            kind: 'input',
            type: 'currency',
            props: {
              currency: 'USD',
              hint: { key: 'cur.hint', default: 'Hint' },
              placeholder: { key: 'cur.ph', default: 'Placeholder' },
            },
          },
        ],
      });

      const i18nCurrency = formDef.form.children[0];
      const isValid = validate(i18nCurrency);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nCurrency);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a number validator with minimum bound', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'amount',
            kind: 'input',
            type: 'currency',
            props: {},
            validator: {
              type: 'number',
              required: true,
              minimum: 0,
              messages: {
                minimum: { key: 'validation.amount.minimum', default: 'Amount cannot be negative' },
              },
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a number validator with exclusive bounds', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'amount',
            kind: 'input',
            type: 'currency',
            props: {},
            validator: {
              type: 'number',
              exclusiveMinimum: 0,
              maximum: 1000000,
              messages: {
                exclusiveMinimum: 'Amount must be greater than 0',
                maximum: 'Amount cannot exceed 1,000,000',
              },
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid enum/type for step', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, step should be a number
          {
            path: 'amount',
            kind: 'input',
            type: 'currency',
            props: {
              step: 'one',
            },
          },
        ],
      });

      const invalidCurrency = formDef.form.children[0];
      const isValid = validate(invalidCurrency);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/step'),
      ).toBe(true);
    });
  });
});
