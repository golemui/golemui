import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/accordion.schema.json';

describe('Accordion schema validation', () => {
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

  it('should validate a minimum valid accordion definition', () => {
    const formDef = golemForm().create({
      form: [
        {
          uid: 'acc-1',
          type: 'accordion',
          kind: 'layout',
          children: [
            {
              uid: 'child-1',
              path: 'some.path',
              kind: 'input',
              type: 'textinput',
              label: 'Child label',
            },
          ],
          props: {
            sections: [{ uid: 'child-1', label: 'General Info' }],
          },
        },
      ],
    });

    const validAccordion = formDef.form.children[0];
    const isValid = validate(validAccordion);
    if (!isValid) {
      specValidationErrorsLogger(validate, validAccordion);
    }
    expect(isValid).toBe(true);
  });

  it('should validate state-scoped properties', () => {
    const formDef = golemForm().create({
      states: {
        registering: '$form.a === true',
        mobile: '$form.b === true',
      },
      form: [
        {
          uid: 'acc-2',
          type: 'accordion',
          kind: 'layout',
          children: [
            {
              uid: 'child-1',
              path: 'some.path',
              kind: 'input',
              type: 'textinput',
              label: 'Child label',
            },
          ],
          props: {
            sections: [{ uid: 's1', label: 'Basic' }],
            'sections.registering': [
              { uid: 's1', label: 'Registration Progress' },
              { uid: 's2', label: 'Security' },
            ],
            'singleOpen.mobile': true,
          },
        },
      ],
    });

    const stateScopedAccordion = formDef.form.children[0];
    const isValid = validate(stateScopedAccordion);
    if (!isValid) {
      specValidationErrorsLogger(validate, stateScopedAccordion);
    }
    expect(isValid).toBe(true);
  });

  it('should fail if "sections" is missing from props', () => {
    const formDef = golemForm().create({
      form: [
        // @ts-expect-error Expected, sections is missing.
        {
          uid: 'acc-3',
          type: 'accordion',
          kind: 'layout',
          children: [
            {
              uid: 'child-1',
              path: 'some.path',
              kind: 'input',
              type: 'textinput',
              label: 'Child label',
            },
          ],
          props: {
            singleOpen: true,
          },
        },
      ],
    });

    const invalidAccordion = formDef.form.children[0];
    const isValid = validate(invalidAccordion);
    expect(isValid).toBe(false);
    expect(validate.errors?.[0].message).toContain("must have required property 'sections'");
  });

  it('should validate i18n localizable labels in sections', () => {
    const formDef = golemForm().create({
      form: [
        {
          uid: 'acc-4',
          type: 'accordion',
          kind: 'layout',
          children: [
            {
              uid: 'child-1',
              path: 'some.path',
              kind: 'input',
              type: 'textinput',
              label: 'Child label',
            },
          ],
          props: {
            sections: [
              {
                uid: 's1',
                label: { key: 'form.accordion.section1', default: 'Fallback Label' },
              },
            ],
          },
        },
      ],
    });

    const i18nAccordion = formDef.form.children[0];
    const isValid = validate(i18nAccordion);
    if (!isValid) {
      specValidationErrorsLogger(validate, i18nAccordion);
    }
    expect(isValid).toBe(true);
  });

  it('should fail on invalid renderMode enum', () => {
    const formDef = golemForm().create({
      form: [
        // @ts-expect-error Expected, invalid renderMode
        {
          uid: 'acc-5',
          type: 'accordion',
          kind: 'layout',
          children: [
            {
              uid: 'child-1',
              path: 'some.path',
              kind: 'input',
              type: 'textinput',
              label: 'Child label',
            },
          ],
          props: {
            sections: [{ uid: 's1', label: 'L' }],
            renderMode: 'on-demand', // Expected: 'all' | 'activeOnly' | 'lazy'
          },
        },
      ],
    });

    const invalidMode = formDef.form.children[0];
    const isValid = validate(invalidMode);
    expect(isValid).toBe(false);
    const hasEnumError = validate.errors?.some((e) => e.keyword === 'enum');
    expect(hasEnumError).toBe(true);
  });

  it('should fail when children is empty', () => {
    const formDef = golemForm().create({
      form: [
        {
          uid: 'acc-5',
          type: 'accordion',
          kind: 'layout',
          children: [],
          props: {
            sections: [{ uid: 's1', label: 'L' }],
          },
        },
      ],
    });

    const invalidMode = formDef.form.children[0];
    const isValid = validate(invalidMode);
    expect(isValid).toBe(false);
    const hasChildrenError = validate.errors?.some(
      (e) => e.instancePath === '/children' && e.message === 'must NOT have fewer than 1 items',
    );
    expect(hasChildrenError).toBe(true);
  });
});
