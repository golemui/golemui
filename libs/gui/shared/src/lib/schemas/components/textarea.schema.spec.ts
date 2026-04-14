import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/textarea.schema.json';

describe('Textarea schema validation', () => {
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
    it('should validate a minimum valid textarea definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'comments',
            kind: 'input',
            type: 'textarea',
            props: {},
          },
        ],
      });

      const validTextarea = formDef.form.children[0];
      const isValid = validate(validTextarea);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTextarea);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'comments',
            kind: 'input',
            type: 'textarea',
            props: {
              hint: 'Write a detailed comment',
              placeholder: 'Type here...',
              icon: 'comment-icon',
              counterMode: 'current',
              minimumHeight: 100,
              autoGrow: true,
              maxLength: 500,
            },
          },
        ],
      });

      const validTextarea = formDef.form.children[0];
      const isValid = validate(validTextarea);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTextarea);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'comments',
            kind: 'input',
            type: 'textarea',
            props: {
              'hint.hasError': 'Comment is required',
              'maxLength.isPremium': 2000,
              'autoGrow.isMobile': false,
            },
          },
        ],
      });

      const stateScopedTextarea = formDef.form.children[0];
      const isValid = validate(stateScopedTextarea);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedTextarea);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'txt-1',
            path: 'comments',
            kind: 'input',
            type: 'textarea',
            props: {
              hint: { key: 'txt.hint', default: 'Hint' },
              placeholder: { key: 'txt.ph', default: 'Placeholder' },
            },
          },
        ],
      });

      const i18nTextarea = formDef.form.children[0];
      const isValid = validate(i18nTextarea);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nTextarea);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a string validator with required and length constraints', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'comments',
            kind: 'input',
            type: 'textarea',
            props: {},
            validator: {
              type: 'string',
              required: true,
              minLength: 10,
              maxLength: 500,
              messages: {
                required: 'Comment is required',
                minLength: 'Comment must be at least 10 characters',
                maxLength: { key: 'validation.comments.maxLength', default: 'Comment is too long' },
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
    it('should fail on invalid counterMode enum', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, counterMode is invalid
          {
            uid: 'txt-1',
            path: 'comments',
            kind: 'input',
            type: 'textarea',
            props: {
              counterMode: 'whatever',
            },
          },
        ],
      });

      const invalidTextarea = formDef.form.children[0];
      const isValid = validate(invalidTextarea);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'enum' && e.instancePath === '/props/counterMode',
        ),
      ).toBe(true);
    });
  });
});
