import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/multilist.schema.json';

describe('MultiList schema validation', () => {
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
    it('should validate a minimum valid multiList definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
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
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            props: {
              hint: 'Pick as many as you like',
              items: [{ label: 'Cheese', value: 'cheese' }],
              labelField: 'label',
              valueField: 'value',
              height: 200,
              itemHeight: 40,
              itemRenderer: 'toppingRenderer',
              limit: 3,
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
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            defaultValue: ['cheese', 'bacon', 3],
            props: { items: ['cheese', 'bacon', 3] },
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
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            props: {
              items: [],
              'hint.hasError': 'Selection required',
              'items.hasData': [{ label: 'Bacon', value: 'bacon' }],
              'limit.isRestricted': 2,
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
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            props: {
              items: [],
              hint: { key: 'ml.hint', default: 'MultiList hint' },
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

    it('should validate an array validator with required', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            props: { items: [] },
            validator: {
              type: 'array',
              required: true,
              messages: {
                required: 'Please select at least one topping',
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
    it('should fail on a scalar defaultValue', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error defaultValue must be an array
          {
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            defaultValue: 'cheese',
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

    it('should fail on invalid items type', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error items should be an array
          {
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            props: {
              items: 'not an array',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/items'),
      ).toBe(true);
    });

    it('should fail on unknown props', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'ml-1',
            path: 'toppings',
            kind: 'input',
            type: 'multiList',
            props: {
              items: [],
              // @ts-expect-error unknown prop
              searchFields: ['label'],
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(validate.errors?.some((e) => e.keyword === 'additionalProperties')).toBe(true);
    });
  });
});
