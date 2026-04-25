import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/radiogroup.schema.json';

describe('Radiogroup schema validation', () => {
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
    it('should validate a minimum valid radiogroup definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'radio-1',
            path: 'choice',
            kind: 'input',
            type: 'radiogroup',
            props: {
              options: [],
            },
          },
        ],
      });

      const validRadiogroup = formDef.form.children[0];
      const isValid = validate(validRadiogroup);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRadiogroup);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'radio-1',
            path: 'choice',
            kind: 'input',
            type: 'radiogroup',
            props: {
              hint: 'Select one option',
              options: [{ label: 'Option A', value: 'A' }],
              labelField: 'label',
              valueField: 'value',
              direction: 'row',
            },
          },
        ],
      });

      const validRadiogroup = formDef.form.children[0];
      const isValid = validate(validRadiogroup);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRadiogroup);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'radio-1',
            path: 'choice',
            kind: 'input',
            type: 'radiogroup',
            props: {
              options: [],
              'hint.hasError': 'Required selection',
              'options.isLoaded': [{ label: 'Option B', value: 'B' }],
              'direction.mobile': 'column',
            },
          },
        ],
      });

      const stateScopedRadiogroup = formDef.form.children[0];
      const isValid = validate(stateScopedRadiogroup);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedRadiogroup);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'radio-1',
            path: 'choice',
            kind: 'input',
            type: 'radiogroup',
            props: {
              options: [],
              hint: { key: 'radio.hint', default: 'Radio hint' },
            },
          },
        ],
      });

      const i18nRadiogroup = formDef.form.children[0];
      const isValid = validate(i18nRadiogroup);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nRadiogroup);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a string validator with required', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'choice',
            kind: 'input',
            type: 'radiogroup',
            props: { options: [] },
            validator: {
              type: 'string',
              required: true,
              messages: {
                required: 'Please select an option',
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

    it('should validate a string validator with i18n required message', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'choice',
            kind: 'input',
            type: 'radiogroup',
            props: { options: [] },
            validator: {
              type: 'string',
              required: true,
              messages: {
                required: { key: 'validation.choice.required', default: 'Selection required' },
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
});
