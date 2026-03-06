import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/textinput.schema.json';

describe('Textinput schema validation', () => {
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
    it('should validate a minimum valid textinput definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'firstName',
            kind: 'input',
            type: 'textinput',
            props: {},
          },
        ],
      });

      const validTextinput = formDef.form.children[0];
      const isValid = validate(validTextinput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTextinput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'firstName',
            kind: 'input',
            type: 'textinput',
            props: {
              hint: 'Enter your first name',
              placeholder: 'e.g. John',
              icon: 'user-icon',
            },
          },
        ],
      });

      const validTextinput = formDef.form.children[0];
      const isValid = validate(validTextinput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTextinput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'firstName',
            kind: 'input',
            type: 'textinput',
            props: {
              'hint.hasError': 'Name is required',
              'placeholder.isEmpty': 'Please type name',
            },
          },
        ],
      });

      const stateScopedTextinput = formDef.form.children[0];
      const isValid = validate(stateScopedTextinput);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedTextinput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'firstName',
            kind: 'input',
            type: 'textinput',
            props: {
              hint: { key: 'txt.hint', default: 'Hint' },
              placeholder: { key: 'txt.ph', default: 'Placeholder' },
            },
          },
        ],
      });

      const i18nTextinput = formDef.form.children[0];
      const isValid = validate(i18nTextinput);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nTextinput);
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
            uid: 'txt-1',
            path: 'firstName',
            kind: 'input',
            type: 'textinput',
            props: {
              icon: 123,
            },
          },
        ],
      });

      const invalidTextinput = formDef.form.children[0];
      const isValid = validate(invalidTextinput);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/icon'),
      ).toBe(true);
    });
  });
});
