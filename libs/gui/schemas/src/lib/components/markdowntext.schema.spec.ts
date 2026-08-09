import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import { golemForm } from '@golemui/gui-shared/internals';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/markdowntext.schema.json';

describe('MarkdownText schema validation', () => {
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
    it('should validate a minimal markdownText widget', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'markdownText',
            props: {
              md: '## Hello\n\nThis is **bold** text.',
            },
          },
        ],
      });

      const validWidget = formDef.form.children[0];
      const isValid = validate(validWidget);
      if (!isValid) {
        specValidationErrorsLogger(validate, validWidget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a markdownText widget with all optional properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'markdowntext-widget-01',
            kind: 'display',
            type: 'markdownText',
            size: 12,
            props: {
              md: '## Title\n\n- Item one\n- Item two',
            },
          },
        ],
      });

      const validWidget = formDef.form.children[0];
      const isValid = validate(validWidget);
      if (!isValid) {
        specValidationErrorsLogger(validate, validWidget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a markdownText widget with state-based property overrides', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'markdownText',
            props: {
              md: 'All systems **operational**.',
              'md.hasError': '**Error:** System failure detected.',
            },
          },
        ],
      });

      const validWidget = formDef.form.children[0];
      const isValid = validate(validWidget);
      if (!isValid) {
        specValidationErrorsLogger(validate, validWidget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable md', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'markdownText',
            props: {
              md: { key: 'markdowntext.content', default: '## Fallback content' },
            },
          },
        ],
      });

      const validWidget = formDef.form.children[0];
      const isValid = validate(validWidget);
      if (!isValid) {
        specValidationErrorsLogger(validate, validWidget);
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
            type: 'markdownText',
            props: { md: 'Some content' },
          },
        ],
      });

      const invalidWidget = formDef.form.children[0];
      const isValid = validate(invalidWidget);
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
            type: 'markdownText',
            props: { md: 'Some content' },
          },
        ],
      });

      const invalidWidget = formDef.form.children[0];
      const isValid = validate(invalidWidget);
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
            props: { md: 'Some content' },
          },
        ],
      });

      const invalidWidget = formDef.form.children[0];
      const isValid = validate(invalidWidget);
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
          // @ts-expect-error Expected, type must be 'markdownText'
          {
            kind: 'display',
            type: 'something',
            props: { md: 'Some content' },
          },
        ],
      });

      const invalidWidget = formDef.form.children[0];
      const isValid = validate(invalidWidget);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            schemaPath: '#/properties/type/const',
            message: 'must be equal to constant',
            params: { allowedValue: 'markdownText' },
          }),
        ]),
      );
    });

    it('should invalidate when "props" is entirely missing', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'markdownText',
          },
        ],
      });

      const invalidWidget = formDef.form.children[0];
      const isValid = validate(invalidWidget);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'required', params: { missingProperty: 'props' } }),
        ]),
      );
    });

    it('should invalidate when "props.md" is missing', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "props.md" is missing.
          {
            kind: 'display',
            type: 'markdownText',
            props: {},
          },
        ],
      });

      const invalidWidget = formDef.form.children[0];
      const isValid = validate(invalidWidget);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'required', params: { missingProperty: 'md' } }),
        ]),
      );
    });

    it('should invalidate when "props" contains an unknown property', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'markdownText',
            props: {
              md: 'Some content',
              // @ts-expect-error Expected, unknown property
              unknownProp: 'not allowed',
            },
          },
        ],
      });

      const invalidWidget = formDef.form.children[0];
      const isValid = validate(invalidWidget);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: 'additionalProperties',
            params: { additionalProperty: 'unknownProp' },
          }),
        ]),
      );
    });
  });
});
