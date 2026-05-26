import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/toggle.schema.json';

describe('Toggle schema validation', () => {
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
    it('should validate a minimum valid toggle definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tgl-1',
            path: 'active',
            kind: 'input',
            type: 'toggle',
            props: {},
          },
        ],
      });

      const validToggle = formDef.form.children[0];
      const isValid = validate(validToggle);
      if (!isValid) {
        specValidationErrorsLogger(validate, validToggle);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tgl-1',
            path: 'active',
            kind: 'input',
            type: 'toggle',
            props: {
              togglePosition: 'left',
              hint: 'Set to active',
            },
          },
        ],
      });

      const validToggle = formDef.form.children[0];
      const isValid = validate(validToggle);
      if (!isValid) {
        specValidationErrorsLogger(validate, validToggle);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tgl-1',
            path: 'active',
            kind: 'input',
            type: 'toggle',
            props: {
              'togglePosition.isMobile': 'right',
              'hint.hasError': 'Must agree',
            },
          },
        ],
      });

      const stateScopedToggle = formDef.form.children[0];
      const isValid = validate(stateScopedToggle);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedToggle);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tgl-1',
            path: 'active',
            kind: 'input',
            type: 'toggle',
            props: {
              hint: { key: 'tgl.hint', default: 'Toggle hint' },
            },
          },
        ],
      });

      const i18nToggle = formDef.form.children[0];
      const isValid = validate(i18nToggle);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nToggle);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a boolean validator with required', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'active',
            kind: 'input',
            type: 'toggle',
            props: {},
            validator: {
              type: 'boolean',
              required: true,
              messages: {
                invalid: 'Must be enabled or disabled',
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

    it('should validate a boolean validator with i18n messages', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'active',
            kind: 'input',
            type: 'toggle',
            props: {},
            validator: {
              type: 'boolean',
              const: true,
              messages: {
                const: { key: 'validation.active.const', default: 'Must be enabled' },
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
    it('should fail on invalid togglePosition enum', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invlaid togglePosition value
          {
            uid: 'tgl-1',
            path: 'active',
            kind: 'input',
            type: 'toggle',
            props: {
              togglePosition: 'something',
            },
          },
        ],
      });

      const invalidToggle = formDef.form.children[0];
      const isValid = validate(invalidToggle);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'enum' && e.instancePath === '/props/togglePosition',
        ),
      ).toBe(true);
    });
  });
});
