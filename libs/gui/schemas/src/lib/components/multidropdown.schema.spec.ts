import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/multidropdown.schema.json';

describe('MultiDropdown schema validation', () => {
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
    it('should validate a minimum valid multiDropdown definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            props: { items: [] },
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

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            props: {
              placeholder: 'Select countries',
              hint: 'Choose your locations',
              items: [{ label: 'USA', value: 'US' }],
              labelField: 'label',
              valueField: 'value',
              searchFields: ['label'],
              height: 200,
              itemHeight: 40,
              itemRenderer: 'countryRenderer',
              inputDebounce: 300,
              icon: 'flag',
              toggleAriaLabel: 'Show countries',
              removeAriaLabel: 'Remove country',
              removeIcon: 'icon-close',
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

    it('should validate an array defaultValue', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            defaultValue: ['US', 'UK', 3],
            props: { items: ['US', 'UK', 3] },
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

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            props: {
              items: [],
              'placeholder.isEmpty': 'No countries available',
              'hint.hasError': 'Selection required',
              'items.hasData': [{ label: 'UK', value: 'UK' }],
              'icon.hasData': 'flag',
              'removeAriaLabel.isSpanish': 'Quitar país',
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

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            props: {
              items: [],
              hint: { key: 'mdd.hint', default: 'MultiDropdown hint' },
              placeholder: { key: 'mdd.ph', default: 'Placeholder' },
              removeAriaLabel: { key: 'mdd.remove', default: 'Remove' },
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

  describe('validator field', () => {
    it('should validate an array validator with required', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            props: { items: [] },
            validator: {
              type: 'array',
              required: true,
              messages: {
                required: 'Please select at least one country',
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

    it('should validate items as arbitrary objects paired with labelField/valueField/itemRenderer', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'mdd-country',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            props: {
              labelField: 'label',
              valueField: 'id',
              itemRenderer: 'countryItemRenderer',
              items: [
                { id: 'AU', flag: '🇦🇺', label: 'Australia' },
                { id: 'BR', flag: '🇧🇷', label: 'Brazil' },
              ],
            },
          },
        ],
      });
      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on missing props', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
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
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            props: {},
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'required' && e.params['missingProperty'] === 'items',
        ),
      ).toBe(true);
    });

    it('should fail on a scalar defaultValue', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error defaultValue must be an array
          {
            uid: 'mdd-1',
            path: 'countries',
            kind: 'input',
            type: 'multiDropdown',
            defaultValue: 'US',
            props: { items: [] },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/defaultValue'),
      ).toBe(true);
    });
  });
});
