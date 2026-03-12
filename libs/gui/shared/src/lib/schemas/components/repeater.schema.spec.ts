import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/repeater.schema.json';

describe('Repeater schema validation', () => {
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
    it('should validate a minimum valid repeater definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rep-1',
            path: 'items',
            kind: 'input',
            type: 'repeater',
            props: {
              template: {
                uid: 'tpl-1',
                kind: 'layout',
                type: 'flex',
                children: [
                  {
                    uid: 'child-1',
                    kind: 'input',
                    type: 'textinput',
                    path: 'value',
                  },
                ],
              },
            },
          },
        ],
      });

      const validRepeater = formDef.form.children[0];
      const isValid = validate(validRepeater);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRepeater);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rep-1',
            path: 'items',
            kind: 'input',
            type: 'repeater',
            props: {
              addLabel: 'Add Item',
              removeLabel: 'Remove Item',
              limit: 5,
              template: {
                uid: 'tpl-1',
                kind: 'layout',
                type: 'flex',
                children: [
                  {
                    uid: 'child-1',
                    kind: 'input',
                    type: 'textinput',
                    path: 'value',
                  },
                ],
              },
            },
          },
        ],
      });

      const validRepeater = formDef.form.children[0];
      const isValid = validate(validRepeater);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRepeater);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rep-1',
            path: 'items',
            kind: 'input',
            type: 'repeater',
            props: {
              template: {
                uid: 'tpl-1',
                kind: 'layout',
                type: 'flex',
                children: [
                  {
                    uid: 'child-1',
                    kind: 'input',
                    type: 'textinput',
                    path: 'value',
                  },
                ],
              },
              'limit.isFreePlan': 3,
            },
          },
        ],
      });

      const stateScopedRepeater = formDef.form.children[0];
      const isValid = validate(stateScopedRepeater);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedRepeater);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rep-1',
            path: 'items',
            kind: 'input',
            type: 'repeater',
            props: {
              addLabel: { key: 'rep.add', default: 'Add' },
              removeLabel: { key: 'rep.remove', default: 'Remove' },
              template: {
                uid: 'tpl-1',
                kind: 'layout',
                type: 'flex',
                children: [
                  {
                    uid: 'child-1',
                    kind: 'input',
                    type: 'textinput',
                    path: 'value',
                  },
                ],
              },
            },
          },
        ],
      });

      const i18nRepeater = formDef.form.children[0];
      const isValid = validate(i18nRepeater);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nRepeater);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a nested repeater definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'team-repeater',
            path: 'teams',
            kind: 'input',
            type: 'repeater',
            props: {
              addLabel: 'Add Team',
              template: {
                uid: 'team-tpl',
                kind: 'layout',
                type: 'flex',
                children: [
                  {
                    uid: 'team-name',
                    kind: 'input',
                    type: 'textinput',
                    path: 'teams.items.teamName',
                  },
                  {
                    uid: 'member-repeater',
                    kind: 'input',
                    type: 'repeater',
                    path: 'teams.items.members',
                    props: {
                      addLabel: 'Add Member',
                      removeLabel: 'Remove Member',
                      limit: 10,
                      template: {
                        uid: 'member-tpl',
                        kind: 'layout',
                        type: 'flex',
                        children: [
                          {
                            uid: 'member-name',
                            kind: 'input',
                            type: 'textinput',
                            path: 'teams.items.members.items.memberName',
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      });

      const nestedRepeater = formDef.form.children[0];
      const isValid = validate(nestedRepeater);
      if (!isValid) {
        specValidationErrorsLogger(validate, nestedRepeater);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid type for limit', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid type for limit
          {
            uid: 'rep-1',
            path: 'items',
            kind: 'array',
            type: 'repeater',
            props: {
              template: {
                uid: 'tpl-1',
                kind: 'input',
                type: 'textinput',
                path: 'value',
              },
              limit: 'five',
            },
          },
        ],
      });

      const invalidRepeater = formDef.form.children[0];
      const isValid = validate(invalidRepeater);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/limit'),
      ).toBe(true);
    });
  });
});
