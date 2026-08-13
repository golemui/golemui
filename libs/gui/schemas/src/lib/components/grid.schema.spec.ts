import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/grid.schema.json';

describe('Grid schema validation', () => {
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
    it('should validate a minimum valid grid definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-0',
                kind: 'input',
                type: 'textinput',
                path: 'f0',
              },
            ],
            props: {},
          },
        ],
      });

      const validGrid = formDef.form.children[0];
      const isValid = validate(validGrid);
      if (!isValid) {
        specValidationErrorsLogger(validate, validGrid);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              direction: 'row',
              columnGap: 16,
              rowGap: 8,
            },
          },
        ],
      });

      const validGrid = formDef.form.children[0];
      const isValid = validate(validGrid);
      if (!isValid) {
        specValidationErrorsLogger(validate, validGrid);
      }
      expect(isValid).toBe(true);
    });

    it('should validate autoFit property with row direction', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              direction: 'row',
              autoFit: true,
            },
          },
        ],
      });

      const validGrid = formDef.form.children[0];
      const isValid = validate(validGrid);
      if (!isValid) {
        specValidationErrorsLogger(validate, validGrid);
      }
      expect(isValid).toBe(true);
    });

    it('should validate align property', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              direction: 'row',
              align: 'center',
            },
          },
        ],
      });

      const validGrid = formDef.form.children[0];
      const isValid = validate(validGrid);
      if (!isValid) {
        specValidationErrorsLogger(validate, validGrid);
      }
      expect(isValid).toBe(true);
    });

    it('should validate justify property', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              direction: 'row',
              justify: 'stretch',
            },
          },
        ],
      });

      const validGrid = formDef.form.children[0];
      const isValid = validate(validGrid);
      if (!isValid) {
        specValidationErrorsLogger(validate, validGrid);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              'direction.isMobile': 'column',
              'columnGap.isDesktop': 24,
              'rowGap.isDesktop': 12,
              'align.isMobile': 'center',
              'justify.isDesktop': 'stretch',
            },
          },
        ],
      });

      const stateScopedGrid = formDef.form.children[0];
      const isValid = validate(stateScopedGrid);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedGrid);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid enum for direction', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, direction is invalid
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              direction: 'diagonal',
            },
          },
        ],
      });

      const invalidGrid = formDef.form.children[0];
      const isValid = validate(invalidGrid);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'enum' && e.instancePath === '/props/direction'),
      ).toBe(true);
    });

    it('should fail on invalid enum for align', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, align is invalid
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              align: 'diagonal',
            },
          },
        ],
      });

      const invalidGrid = formDef.form.children[0];
      const isValid = validate(invalidGrid);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'enum' && e.instancePath === '/props/align'),
      ).toBe(true);
    });

    it('should fail on invalid enum for justify', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, justify is invalid
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [
              {
                uid: 'grid-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              justify: 'space-between',
            },
          },
        ],
      });

      const invalidGrid = formDef.form.children[0];
      const isValid = validate(invalidGrid);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'enum' && e.instancePath === '/props/justify'),
      ).toBe(true);
    });

    it('should fail on empty children', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'grid-1',
            kind: 'layout',
            type: 'grid',
            children: [],
          },
        ],
      });

      const invalidGrid = formDef.form.children[0];
      const isValid = validate(invalidGrid);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.message === 'must NOT have fewer than 1 items' && e.instancePath === '/children',
        ),
      ).toBe(true);
    });
  });
});
