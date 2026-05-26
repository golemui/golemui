import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/dateinput.schema.json';

describe('Dateinput schema validation', () => {
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
    it('should validate a minimum valid dateinput definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'bday',
            kind: 'input',
            type: 'dateInput',
            props: {},
          },
        ],
      });

      const validDateInput = formDef.form.children[0];
      const isValid = validate(validDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDateInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'bday',
            kind: 'input',
            type: 'dateInput',
            props: {
              hint: 'Enter your birthday',
              icon: 'calendar',
            },
          },
        ],
      });

      const validDateInput = formDef.form.children[0];
      const isValid = validate(validDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDateInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'bday',
            kind: 'input',
            type: 'dateInput',
            props: {
              'hint.hasError': 'Date required',
            },
          },
        ],
      });

      const stateScopedDateInput = formDef.form.children[0];
      const isValid = validate(stateScopedDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedDateInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'bday',
            kind: 'input',
            type: 'dateInput',
            props: {
              hint: { key: 'di.hint', default: 'Hint' },
            },
          },
        ],
      });

      const i18nDateInput = formDef.form.children[0];
      const isValid = validate(i18nDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nDateInput);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a string validator with format: date', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'bday',
            kind: 'input',
            type: 'dateInput',
            props: {},
            validator: {
              type: 'string',
              required: true,
              format: 'date',
              messages: {
                required: 'Date of birth is required',
                format: { key: 'validation.bday.format', default: 'Enter a valid date' },
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
    it('should fail on invalid type for icon', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, icon should be a string
          {
            uid: 'di-1',
            path: 'bday',
            kind: 'input',
            type: 'dateInput',
            props: {
              icon: 123,
            },
          },
        ],
      });

      const invalidDateInput = formDef.form.children[0];
      const isValid = validate(invalidDateInput);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/icon'),
      ).toBe(true);
    });
  });
});
