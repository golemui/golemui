import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/select.schema.json';

describe('Select schema validation', () => {
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
    it('should validate a minimum valid select definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'sel-1',
            path: 'choice',
            kind: 'input',
            type: 'select',
            props: {
              options: [],
            },
          },
        ],
      });

      const validSelect = formDef.form.children[0];
      const isValid = validate(validSelect);
      if (!isValid) {
        specValidationErrorsLogger(validate, validSelect);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'sel-1',
            path: 'choice',
            kind: 'input',
            type: 'select',
            props: {
              hint: 'Select an option',
              icon: 'select-icon',
              options: [{ label: 'Option 1', value: 1 }],
              placeholder: 'Choose...',
              labelField: 'label',
              valueField: 'value',
            },
          },
        ],
      });

      const validSelect = formDef.form.children[0];
      const isValid = validate(validSelect);
      if (!isValid) {
        specValidationErrorsLogger(validate, validSelect);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'sel-1',
            path: 'choice',
            kind: 'input',
            type: 'select',
            props: {
              options: [],
              'hint.hasError': 'Must select one',
              'options.isLoaded': [{ label: 'Loaded', value: 2 }],
            },
          },
        ],
      });

      const stateScopedSelect = formDef.form.children[0];
      const isValid = validate(stateScopedSelect);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedSelect);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'sel-1',
            path: 'choice',
            kind: 'input',
            type: 'select',
            props: {
              options: [],
              hint: { key: 'sel.hint', default: 'Hint' },
              placeholder: { key: 'sel.ph', default: 'Placeholder' },
            },
          },
        ],
      });

      const i18nSelect = formDef.form.children[0];
      const isValid = validate(i18nSelect);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nSelect);
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
            type: 'select',
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
            type: 'select',
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
