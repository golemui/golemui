import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/password.schema.json';

describe('Password schema validation', () => {
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
    it('should validate a minimum valid password definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'pwd-1',
            path: 'secret',
            kind: 'input',
            type: 'password',
            props: {},
          },
        ],
      });

      const validPassword = formDef.form.children[0];
      const isValid = validate(validPassword);
      if (!isValid) {
        specValidationErrorsLogger(validate, validPassword);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'pwd-1',
            path: 'secret',
            kind: 'input',
            type: 'password',
            props: {
              hint: 'Enter your password',
              placeholder: 'Top secret',
              icon: 'lock',
              showPasswordIcon: 'eye',
              hidePasswordIcon: 'eye-off',
            },
          },
        ],
      });

      const validPassword = formDef.form.children[0];
      const isValid = validate(validPassword);
      if (!isValid) {
        specValidationErrorsLogger(validate, validPassword);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'pwd-1',
            path: 'secret',
            kind: 'input',
            type: 'password',
            props: {
              'hint.hasError': 'Weak password',
              'showPasswordIcon.isMobile': 'eye-m',
            },
          },
        ],
      });

      const stateScopedPassword = formDef.form.children[0];
      const isValid = validate(stateScopedPassword);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedPassword);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'pwd-1',
            path: 'secret',
            kind: 'input',
            type: 'password',
            props: {
              hint: { key: 'pwd.hint', default: 'Hint' },
              placeholder: { key: 'pwd.ph', default: 'Placeholder' },
            },
          },
        ],
      });

      const i18nPassword = formDef.form.children[0];
      const isValid = validate(i18nPassword);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nPassword);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a string validator with required and length constraints', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'secret',
            kind: 'input',
            type: 'password',
            props: {},
            validator: {
              type: 'string',
              required: true,
              minLength: 8,
              maxLength: 64,
              messages: {
                required: 'Password is required',
                minLength: 'Password must be at least 8 characters',
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

    it('should validate a string validator with i18n messages', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'secret',
            kind: 'input',
            type: 'password',
            props: {},
            validator: {
              type: 'string',
              required: true,
              messages: {
                required: { key: 'validation.password.required', default: 'Password is required' },
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
    it('should fail on invalid type for showPasswordIcon', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, showPasswordIcon should be a string
          {
            uid: 'pwd-1',
            path: 'secret',
            kind: 'input',
            type: 'password',
            props: {
              showPasswordIcon: 123,
            },
          },
        ],
      });

      const invalidPassword = formDef.form.children[0];
      const isValid = validate(invalidPassword);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'type' && e.instancePath === '/props/showPasswordIcon',
        ),
      ).toBe(true);
    });
  });
});
