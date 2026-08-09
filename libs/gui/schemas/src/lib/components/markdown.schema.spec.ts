import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import { golemForm } from '@golemui/gui-shared/internals';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/markdown.schema.json';

describe('Markdown schema validation', () => {
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
    it('should validate a minimum valid markdown definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'content',
            kind: 'input',
            type: 'markdown',
            props: {},
          },
        ],
      });

      const validMarkdown = formDef.form.children[0];
      const isValid = validate(validMarkdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, validMarkdown);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'content',
            kind: 'input',
            type: 'markdown',
            props: {
              hint: 'Write your content',
              placeholder: 'Start typing...',
              counterMode: 'remaining',
              minimumHeight: 200,
              autoGrow: true,
              defaultOpenPreview: false,
              maxLength: 5000,
              tools: ['H', 'B', 'I', '|', 'Q', 'L', 'OL', 'UL'],
              headingTitle: 'Heading',
              boldTitle: 'Bold',
              italicTitle: 'Italic',
              strikethroughTitle: 'Strikethrough',
              quoteTitle: 'Quote',
              linkTitle: 'Link',
              orderedListTitle: 'Ordered list',
              unorderedListTitle: 'Unordered list',
              splitViewTitle: 'Split view',
              toolbarAriaLabel: 'Formatting tools',
            },
          },
        ],
      });

      const validMarkdown = formDef.form.children[0];
      const isValid = validate(validMarkdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, validMarkdown);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'content',
            kind: 'input',
            type: 'markdown',
            props: {
              'hint.hasError': 'Content required',
              'placeholder.isEmpty': 'Please write something',
            },
          },
        ],
      });

      const stateScopedMarkdown = formDef.form.children[0];
      const isValid = validate(stateScopedMarkdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedMarkdown);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'content',
            kind: 'input',
            type: 'markdown',
            props: {
              hint: { key: 'md.hint', default: 'Hint' },
              placeholder: { key: 'md.placeholder', default: 'Placeholder' },
              headingTitle: { key: 'md.heading', default: 'Heading' },
              boldTitle: { key: 'md.bold', default: 'Bold' },
              italicTitle: { key: 'md.italic', default: 'Italic' },
              strikethroughTitle: { key: 'md.strikethrough', default: 'Strikethrough' },
              quoteTitle: { key: 'md.quote', default: 'Quote' },
              linkTitle: { key: 'md.link', default: 'Link' },
              orderedListTitle: { key: 'md.ol', default: 'Ordered list' },
              unorderedListTitle: { key: 'md.ul', default: 'Unordered list' },
            },
          },
        ],
      });

      const i18nMarkdown = formDef.form.children[0];
      const isValid = validate(i18nMarkdown);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nMarkdown);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a string validator with required and length constraints', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'content',
            kind: 'input',
            type: 'markdown',
            props: {},
            validator: {
              type: 'string',
              required: true,
              minLength: 10,
              maxLength: 5000,
              messages: {
                required: 'Content is required',
                minLength: { key: 'validation.content.minLength', default: 'Content is too short' },
                maxLength: 'Content cannot exceed 5000 characters',
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
    it('should fail on invalid type for hint', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, hint should be a string or localizable object
          {
            uid: 'md-1',
            path: 'content',
            kind: 'input',
            type: 'markdown',
            props: {
              hint: 123,
            },
          },
        ],
      });

      const invalidMarkdown = formDef.form.children[0];
      const isValid = validate(invalidMarkdown);
      expect(isValid).toBe(false);
    });
  });
});
