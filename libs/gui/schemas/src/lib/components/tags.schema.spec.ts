import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/tags.schema.json';

describe('Tags schema validation', () => {
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
    it('should validate a minimum valid tags definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tags-1',
            path: 'keywords',
            kind: 'input',
            type: 'tags',
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate all valid props', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tags-1',
            path: 'keywords',
            kind: 'input',
            type: 'tags',
            props: {
              hint: 'Press Enter to add',
              placeholder: 'Add a tag…',
              separators: ['Enter', ','],
              allowDuplicates: false,
              trim: true,
              removeAriaLabel: 'Remove tag',
              removeIcon: 'mdi-close',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tags-1',
            path: 'keywords',
            kind: 'input',
            type: 'tags',
            props: {
              trim: true,
              'trim.isFreePlan': false,
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tags-1',
            path: 'keywords',
            kind: 'input',
            type: 'tags',
            label: { key: 'tags.label', default: 'Tags' },
            props: {
              hint: { key: 'tags.hint', default: 'Press Enter' },
              placeholder: { key: 'tags.placeholder', default: 'Add a tag…' },
              removeAriaLabel: { key: 'tags.remove', default: 'Remove tag' },
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate a defaultValue array of strings', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tags-1',
            path: 'keywords',
            kind: 'input',
            type: 'tags',
            defaultValue: ['hello', 'world'],
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate an array validator with required, minItems, maxItems, uniqueItems', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'keywords',
            kind: 'input',
            type: 'tags',
            validator: {
              type: 'array',
              required: true,
              minItems: 1,
              maxItems: 5,
              uniqueItems: true,
              messages: {
                required: 'At least one tag is required',
                minItems: 'Add at least one tag',
                maxItems: 'No more than 5 tags',
              },
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
    it('should fail on invalid type for trim', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid type for trim
          {
            uid: 'tags-1',
            path: 'keywords',
            kind: 'input',
            type: 'tags',
            props: {
              trim: 'yes',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/trim'),
      ).toBe(true);
    });

    it('should fail on unknown prop', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, unknown prop
          {
            uid: 'tags-1',
            path: 'keywords',
            kind: 'input',
            type: 'tags',
            props: {
              foo: 'bar',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
    });
  });
});
