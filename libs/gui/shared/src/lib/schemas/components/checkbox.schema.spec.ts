import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/checkbox.schema.json';

describe('Checkbox schema validation', () => {
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
    it('should validate a minimum valid checkbox definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'agree',
            kind: 'input',
            type: 'checkbox',
            props: {},
          },
        ],
      });

      const validCheckbox = formDef.form.children[0];
      const isValid = validate(validCheckbox);
      if (!isValid) {
        specValidationErrorsLogger(validate, validCheckbox);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'agree',
            kind: 'input',
            type: 'checkbox',
            props: {
              hint: 'Please agree',
              checkboxPosition: 'left',
            },
          },
        ],
      });

      const validCheckbox = formDef.form.children[0];
      const isValid = validate(validCheckbox);
      if (!isValid) {
        specValidationErrorsLogger(validate, validCheckbox);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'agree',
            kind: 'input',
            type: 'checkbox',
            props: {
              'hint.hasError': 'Must agree to terms',
              'checkboxPosition.isMobile': 'right',
            },
          },
        ],
      });

      const stateScopedCheckbox = formDef.form.children[0];
      const isValid = validate(stateScopedCheckbox);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedCheckbox);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'agree',
            kind: 'input',
            type: 'checkbox',
            props: {
              hint: { key: 'chk.hint', default: 'Hint' },
            },
          },
        ],
      });

      const i18nCheckbox = formDef.form.children[0];
      const isValid = validate(i18nCheckbox);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nCheckbox);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid enum for checkboxPosition', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expect6ed, checkboxPosition should be left or right
          {
            path: 'agree',
            kind: 'input',
            type: 'checkbox',
            props: {
              checkboxPosition: 'something',
            },
          },
        ],
      });

      const invalidCheckbox = formDef.form.children[0];
      const isValid = validate(invalidCheckbox);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'enum' && e.instancePath === '/props/checkboxPosition',
        ),
      ).toBe(true);
    });
  });
});
