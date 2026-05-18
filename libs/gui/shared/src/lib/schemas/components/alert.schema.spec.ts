import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { type GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/alert.schema.json';

describe('Alert schema validation', () => {
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
    it('should validate a minimal alert widget', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'alert',
            props: {
              text: 'This is a basic alert',
            },
          },
        ],
      });

      const validAlert = formDef.form.children[0];
      const isValid = validate(validAlert);
      if (!isValid) {
        specValidationErrorsLogger(validate, validAlert);
      }
      expect(isValid).toBe(true);
    });

    it('should validate an alert with all optional properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'alert-widget-01',
            kind: 'display',
            type: 'alert',
            size: 12,
            props: {
              text: 'Operation completed successfully.',
              level: 'success',
            },
          },
        ],
      });

      const validAlert = formDef.form.children[0];
      const isValid = validate(validAlert);
      if (!isValid) {
        specValidationErrorsLogger(validate, validAlert);
      }
      expect(isValid).toBe(true);
    });

    it('should validate an alert with state-based property overrides', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'alert',
            props: {
              text: 'System status normal',
              level: 'info',
              'text.hasError': 'System failure detected!',
              'level.hasError': 'error',
            },
          },
        ],
      });

      const validAlert = formDef.form.children[0];
      const isValid = validate(validAlert);
      if (!isValid) {
        specValidationErrorsLogger(validate, validAlert);
      }
      expect(isValid).toBe(true);
    });
    it('should validate i18n localizable labels in text', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'alert',
            props: {
              text: { key: 'alert.msg', default: 'Fallback Alert Message' },
            },
          },
        ],
      });

      const i18nAlert = formDef.form.children[0];
      const isValid = validate(i18nAlert);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nAlert);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should invalidate when "kind" is missing', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, kind is missing.
          {
            type: 'alert',
            props: { text: 'Missing kind' },
          },
        ],
      });

      const invalidAlert = formDef.form.children[0];
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "must have required property 'kind'" }),
        ]),
      );
    });

    it('should invalidate when "kind" is incorrect', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, kind must be 'display'
          {
            kind: 'input',
            type: 'alert',
            props: { text: 'Missing kind' },
          },
        ],
      });

      const invalidAlert = formDef.form.children[0];
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            schemaPath: '#/properties/kind/const',
            message: 'must be equal to constant',
            params: { allowedValue: 'display' },
          }),
        ]),
      );
    });

    it('should invalidate when "type" is missing', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "type" is missing.
          {
            kind: 'display',
            props: { text: 'Missing type' },
          },
        ],
      });

      const invalidAlert = formDef.form.children[0];
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "must have required property 'type'" }),
        ]),
      );
    });

    it('should invalidate when "type" is incorrect', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, type must be 'alert'
          {
            kind: 'display',
            type: 'something',
            props: { text: 'Invalid type' },
          },
        ],
      });

      const invalidAlert = formDef.form.children[0];
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            schemaPath: '#/properties/type/const',
            message: 'must be equal to constant',
            params: { allowedValue: 'alert' },
          }),
        ]),
      );
    });

    it('should invalidate when "props" is entirely missing', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'alert',
          },
        ],
      });

      const invalidAlert = formDef.form.children[0];
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'required', params: { missingProperty: 'props' } }),
        ]),
      );
    });

    it('should invalidate when "props.text" is missing', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "props.text" is missing.
          {
            kind: 'display',
            type: 'alert',
            props: {
              level: 'info',
            },
          },
        ],
      });

      const invalidAlert = formDef.form.children[0];
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'required', params: { missingProperty: 'text' } }),
        ]),
      );
    });

    it('should invalidate when "props.level" has an unrecognized enum value', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid value for level.
          {
            kind: 'display',
            type: 'alert',
            props: {
              text: 'Critical meltdown',
              level: 'superbad',
            },
          },
        ],
      });

      const invalidAlert = formDef.form.children[0];
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'enum', instancePath: '/props/level' }),
        ]),
      );
    });
  });
});
