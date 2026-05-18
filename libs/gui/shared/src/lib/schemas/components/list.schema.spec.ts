import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { type GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/list.schema.json';

describe('List schema validation', () => {
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
    it('should validate a minimum valid list definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'list-1',
            path: 'tags',
            kind: 'input',
            type: 'list',
            props: {
              items: [],
            },
          },
        ],
      });

      const validList = formDef.form.children[0];
      const isValid = validate(validList);
      if (!isValid) {
        specValidationErrorsLogger(validate, validList);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'list-1',
            path: 'tags',
            kind: 'input',
            type: 'list',
            props: {
              hint: 'Select tags',
              items: [{ template: { label: 'Tech' }, value: 'tech' }],
              labelField: 'label',
              valueField: 'value',
              height: 300,
              itemHeight: 50,
              itemRenderer: 'tagRenderer',
            },
          },
        ],
      });

      const validList = formDef.form.children[0];
      const isValid = validate(validList);
      if (!isValid) {
        specValidationErrorsLogger(validate, validList);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        states: {
          hasError: '',
          isLoaded: '',
          isMobile: '',
        },
        form: [
          {
            uid: 'list-1',
            path: 'tags',
            kind: 'input',
            type: 'list',
            props: {
              items: [],
              'hint.hasError': 'Must select at least one',
              'items.isLoaded': [{ template: { label: 'Science' }, value: 'science' }],
              'height.isMobile': 200,
            },
          },
        ],
      });

      const stateScopedList = formDef.form.children[0];
      const isValid = validate(stateScopedList);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedList);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'list-1',
            path: 'tags',
            kind: 'input',
            type: 'list',
            props: {
              items: [],
              hint: { key: 'list.hint', default: 'List hint' },
            },
          },
        ],
      });

      const i18nList = formDef.form.children[0];
      const isValid = validate(i18nList);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nList);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate an array validator with required and minItems', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'tags',
            kind: 'input',
            type: 'list',
            props: { items: [] },
            validator: {
              type: 'array',
              required: true,
              minItems: 1,
              maxItems: 10,
              messages: {
                required: 'Please select at least one tag',
                minItems: { key: 'validation.tags.minItems', default: 'Select at least one tag' },
                maxItems: 'You can select at most 10 tags',
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
    it('should fail on invalid items type', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid items type
          {
            uid: 'list-1',
            path: 'tags',
            kind: 'input',
            type: 'list',
            props: {
              items: 'not an array',
            },
          },
        ],
      });

      const invalidList = formDef.form.children[0];
      const isValid = validate(invalidList);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/items'),
      ).toBe(true);
    });
  });
});
