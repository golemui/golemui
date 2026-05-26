import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import { golemForm } from '@golemui/gui-shared';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

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

  describe('validator field', () => {
    it('should validate a string validator with required and length constraints', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'username',
            kind: 'input',
            type: 'textinput',
            props: {},
            validator: {
              type: 'string',
              required: true,
              minLength: 4,
              maxLength: 20,
              messages: {
                required: 'Username is required',
                minLength: 'Too short',
                maxLength: 'Too long',
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

    it('should validate a string validator with pattern and i18n messages', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'zipCode',
            kind: 'input',
            type: 'textinput',
            props: {},
            validator: {
              type: 'string',
              pattern: '^\\d{5}$',
              messages: {
                pattern: { key: 'validation.zipCode.pattern', default: 'Invalid ZIP code' },
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

    it('should validate a string validator with format', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'website',
            kind: 'input',
            type: 'textinput',
            props: {},
            validator: {
              type: 'string',
              format: 'url',
              messages: {
                format: { key: 'validation.website.format' },
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

    it('should validate a custom validator with arbitrary rule keys', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'username',
            kind: 'input',
            type: 'textinput',
            props: {},
            validator: {
              type: 'custom',
              required: true,
              noSpaces: true,
              alphanumericOnly: true,
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

    it('should fail on an unknown validator type', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, type is not a valid validator type
          {
            path: 'firstName',
            kind: 'input',
            type: 'textinput',
            props: {},
            validator: { type: 'unknown' },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'oneOf' && e.instancePath === '/validator'),
      ).toBe(true);
    });

    it('should fail on an unknown message key in a string validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'firstName',
            kind: 'input',
            type: 'textinput',
            props: {},
            validator: {
              type: 'string',
              messages: { unknownKey: 'This key does not exist' },
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
    });
  });
});
