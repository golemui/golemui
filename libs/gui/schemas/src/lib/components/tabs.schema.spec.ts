import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/tabs.schema.json';

describe('Tabs schema validation', () => {
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
    it('should validate a minimum valid tabs definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tab-container',
            kind: 'layout',
            type: 'tabs',
            children: [
              {
                uid: 'tab-content-0',
                kind: 'input',
                type: 'textinput',
                path: 'field0',
              },
            ],
            props: {
              tabs: [{ label: 'Tab 1', uid: 'tab-content-0' }],
            },
          },
        ],
      });

      const validTabs = formDef.form.children[0];
      const isValid = validate(validTabs);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTabs);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tab-container',
            kind: 'layout',
            type: 'tabs',
            children: [
              {
                uid: 'tab-content-1',
                kind: 'input',
                type: 'textinput',
                path: 'field1',
              },
            ],
            props: {
              defaultOpen: 'tab-content-1',
              renderMode: 'activeOnly',
              tabs: [{ label: 'Tab 1', uid: 'tab-content-1' }],
            },
          },
        ],
      });

      const validTabs = formDef.form.children[0];
      const isValid = validate(validTabs);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTabs);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tab-container',
            kind: 'layout',
            type: 'tabs',
            children: [
              {
                uid: 'tab-content-0',
                kind: 'input',
                type: 'textinput',
                path: 'field0',
              },
            ],
            props: {
              tabs: [{ label: 'Tab 1', uid: 'tab-content-0' }],
              'defaultOpen.isMobile': 'tab2',
              'tabs.hasMore': [{ label: 'Extra', uid: 'tab3' }],
            },
          },
        ],
      });

      const stateScopedTabs = formDef.form.children[0];
      const isValid = validate(stateScopedTabs);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedTabs);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid renderMode enum', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid enum
          {
            uid: 'tab-container',
            kind: 'layout',
            type: 'tabs',
            children: [
              {
                uid: 'tab-content-0',
                kind: 'input',
                type: 'textinput',
                path: 'field0',
              },
            ],
            props: {
              tabs: [],
              renderMode: 'lazy', // Expected: "all" | "activeOnly"
            },
          },
        ],
      });

      const invalidTabs = formDef.form.children[0];
      const isValid = validate(invalidTabs);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'enum' && e.instancePath === '/props/renderMode',
        ),
      ).toBe(true);
    });
  });
});
