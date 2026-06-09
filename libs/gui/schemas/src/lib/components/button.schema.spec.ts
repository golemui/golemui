import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import { golemForm } from '@golemui/gui-shared/internals';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/button.schema.json';

describe('Button schema validation', () => {
  let ajv: Ajv2020;
  let validate: GetSchema;

  beforeEach(() => {
    ajv = new Ajv2020({
      allErrors: true,
      strict: false, // Set to false to allow dynamic property patterns
      verbose: true,
    });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) {
      throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
    }
  });

  describe('Valid configurations', () => {
    it('should validate a minimum valid button definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'action',
            type: 'button',
          },
        ],
      });

      const validButton = formDef.form.children[0];
      const isValid = validate(validButton);
      if (!isValid) {
        specValidationErrorsLogger(validate, validButton);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            props: {
              variant: 'filled',
              icon: 'settings_icon',
              iconPosition: 'right',
            },
          },
        ],
      });

      const validButton = formDef.form.children[0];
      const isValid = validate(validButton);
      if (!isValid) {
        specValidationErrorsLogger(validate, validButton);
      }
      expect(isValid).toBe(true);
    });

    it('should validate link variant', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'action',
            type: 'button',
            props: {
              variant: 'link',
            },
          },
        ],
      });

      const validButton = formDef.form.children[0];
      const isValid = validate(validButton);
      if (!isValid) {
        specValidationErrorsLogger(validate, validButton);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'action',
            type: 'button',
            props: {
              variant: 'outlined',
              'variant.isPrimary': 'filled',
            },
          },
        ],
      });

      const stateScopedButton = formDef.form.children[0];
      const isValid = validate(stateScopedButton);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedButton);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid variant enum', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid variant
          {
            kind: 'action',
            type: 'button',
            props: {
              variant: 'solid',
            },
          },
        ],
      });

      const invalidButton = formDef.form.children[0];
      const isValid = validate(invalidButton);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'enum' && e.instancePath === '/props/variant'),
      ).toBe(true);
    });

    it('should fail on invalid iconPosition enum', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid iconPosition
          {
            kind: 'action',
            type: 'button',
            props: {
              iconPosition: 'top',
            },
          },
        ],
      });

      const invalidButton = formDef.form.children[0];
      const isValid = validate(invalidButton);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'enum' && e.instancePath === '/props/iconPosition',
        ),
      ).toBe(true);
    });

    it('should fail on invalid actionType enum', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid iconPosition
          {
            kind: 'action',
            type: 'button',
            actionType: 'banana ice cream',
          },
        ],
      });

      const invalidButton = formDef.form.children[0];
      const isValid = validate(invalidButton);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'enum' && e.instancePath === '/actionType'),
      ).toBe(true);
    });

    it('should fail if kind or type is wrong', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, wrong kind
          {
            kind: 'input',
            type: 'button',
            props: {},
          },
        ],
      });
      const invalidButton = formDef.form.children[0];
      const isValid = validate(invalidButton);
      expect(isValid).toBe(false);
    });
  });
});
