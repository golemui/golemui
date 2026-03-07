import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/flex.schema.json';

describe('Flex schema validation', () => {
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
    it('should validate a minimum valid flex definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'flex-1',
            kind: 'layout',
            type: 'flex',
            children: [
              {
                uid: 'flex-child-0',
                kind: 'input',
                type: 'textinput',
                path: 'f0',
              },
            ],
            props: {},
          },
        ],
      });

      const validFlex = formDef.form.children[0];
      const isValid = validate(validFlex);
      if (!isValid) {
        specValidationErrorsLogger(validate, validFlex);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'flex-1',
            kind: 'layout',
            type: 'flex',
            children: [
              {
                uid: 'flex-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              direction: 'row',
              align: 'center',
              gap: 16,
            },
          },
        ],
      });

      const validFlex = formDef.form.children[0];
      const isValid = validate(validFlex);
      if (!isValid) {
        specValidationErrorsLogger(validate, validFlex);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'flex-1',
            kind: 'layout',
            type: 'flex',
            children: [
              {
                uid: 'flex-child-1',
                kind: 'input',
                type: 'textinput',
                path: 'f1',
              },
            ],
            props: {
              'direction.isMobile': 'column',
              'gap.isDesktop': 24,
            },
          },
        ],
      });

      const stateScopedFlex = formDef.form.children[0];
      const isValid = validate(stateScopedFlex);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedFlex);
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
            uid: 'flex-1',
            kind: 'layout',
            type: 'flex',
            children: [
              {
                uid: 'flex-child-1',
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

      const invalidFlex = formDef.form.children[0];
      const isValid = validate(invalidFlex);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'enum' && e.instancePath === '/props/direction'),
      ).toBe(true);
    });

    it('should fail on empty children', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'flex-1',
            kind: 'layout',
            type: 'flex',
            children: [],
          },
        ],
      });

      const invalidFlex = formDef.form.children[0];
      const isValid = validate(invalidFlex);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.message === 'must NOT have fewer than 1 items' && e.instancePath === '/children',
        ),
      ).toBe(true);
    });
  });
});
