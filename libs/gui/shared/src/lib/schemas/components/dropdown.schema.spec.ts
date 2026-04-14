import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/dropdown.schema.json';

describe('Dropdown schema validation', () => {
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
    it('should validate a minimum valid dropdown definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dd-1',
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: { items: [] },
          },
        ],
      });

      const validDropdown = formDef.form.children[0];
      const isValid = validate(validDropdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDropdown);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dd-1',
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: {
              placeholder: 'Select a country',
              hint: 'Choose your location',
              items: [{ template: { label: 'USA' }, value: 'US' }],
              labelField: 'label',
              valueField: 'value',
              searchFields: ['label'],
              height: 200,
              itemHeight: 40,
              itemRenderer: 'countryRenderer',
              inputDebounce: 300,
            },
          },
        ],
      });

      const validDropdown = formDef.form.children[0];
      const isValid = validate(validDropdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDropdown);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dd-1',
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: {
              items: [],
              'placeholder.isEmpty': 'No countries available',
              'hint.hasError': 'Selection required',
              'items.hasData': [{ template: { label: 'UK' }, value: 'UK' }],
              'inputDebounce.isSlow': 1000,
            },
          },
        ],
      });

      const stateScopedDropdown = formDef.form.children[0];
      const isValid = validate(stateScopedDropdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedDropdown);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dd-1',
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: {
              items: [],
              hint: { key: 'dd.hint', default: 'Dropdown hint' },
              placeholder: { key: 'dd.ph', default: 'Placeholder' },
            },
          },
        ],
      });

      const i18nDropdown = formDef.form.children[0];
      const isValid = validate(i18nDropdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nDropdown);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a string validator with required', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: { items: [] },
            validator: {
              type: 'string',
              required: true,
              messages: {
                required: 'Please select a country',
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
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: { items: [] },
            validator: {
              type: 'string',
              required: true,
              messages: {
                required: { key: 'validation.country.required', default: 'Country is required' },
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
    it('should fail on missing props', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dd-1',
            path: 'country',
            kind: 'input',
            type: 'dropdown',
          },
        ],
      });

      const invalidDropdown = formDef.form.children[0];
      const isValid = validate(invalidDropdown);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'required' && e.params['missingProperty'] === 'props',
        ),
      ).toBe(true);
    });

    it('should fail on missing items in props', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error items is required
          {
            uid: 'dd-1',
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: {},
          },
        ],
      });

      const invalidDropdown = formDef.form.children[0];
      const isValid = validate(invalidDropdown);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'required' && e.params['missingProperty'] === 'items',
        ),
      ).toBe(true);
    });

    it('should fail on invalid items type', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error items should be an array
          {
            uid: 'dd-1',
            path: 'country',
            kind: 'input',
            type: 'dropdown',
            props: {
              items: 'not an array',
            },
          },
        ],
      });

      const invalidDropdown = formDef.form.children[0];
      const isValid = validate(invalidDropdown);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/items'),
      ).toBe(true);
    });
  });
});
