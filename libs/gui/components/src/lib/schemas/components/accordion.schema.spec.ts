import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020, { ErrorObject } from 'ajv/dist/2020';
import * as commonSchema from '../common.schema.json';
import * as formSchema from '../form.schema.json';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/accordion.schema.json';

/**
 * Enhanced Error Reporter
 */
function logValidationErrors(validate: any, data: any) {
  if (validate.errors) {
    console.error('--- GolemUI Validation Failed ---');
    console.error('Data under test:', JSON.stringify(data, null, 2));
    validate.errors.forEach((err: ErrorObject) => {
      console.error(`- Path: ${err.instancePath}`);
      console.error(`  Message: ${err.message}`);
      console.error(`  Params:`, err.params);
      if (err.keyword === 'additionalProperties') {
        console.error(`  Unknown property: ${err.params['additionalProperty']}`);
      }
    });
    console.error('---------------------------------');
  }
}

function registerGolemSchemas(ajv: Ajv2020) {
  ajv.addSchema(commonSchema);

  // @ts-expect-error The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', 'node18', 'node20', or 'nodenext'.ts(1343)
  // Automatically assemble all component schemas in this folder
  const componentSchemas: Record<string, any> = import.meta.glob('./*.schema.json', {
    // { eager: true, import: 'default' } resolves the JSON objects directly
    eager: true,
    import: 'default',
  });

  for (const path in componentSchemas) {
    const schema = componentSchemas[path];
    if (schema && schema.$id && !ajv.getSchema(schema.$id)) {
      ajv.addSchema(schema);
    }
  }

  if (!ajv.getSchema(formSchema.$id)) {
    ajv.addSchema(formSchema);
  }
}

type GetSchema = NonNullable<ReturnType<Ajv2020['getSchema']>>;

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
      logValidationErrors(validate, validAccordion);
    }
    expect(isValid).toBe(true);
  });

  it('should validate state-scoped properties', () => {
    // GolemUI Core expects props to support 'propertyName.stateName'
    const stateScopedAccordion = {
      uid: 'acc-2',
      type: 'accordion',
      kind: 'layout',
      children: [],
      props: {
        sections: [{ uid: 's1', label: 'Basic' }],
        // This is a common failure point if patternProperties isn't defined
        'sections.registering': [
          { uid: 's1', label: 'Registration Progress' },
          { uid: 's2', label: 'Security' },
        ],
        'singleOpen.mobile': true,
      },
    };

    const isValid = validate(stateScopedAccordion);
    if (!isValid) {
      logValidationErrors(validate, stateScopedAccordion);
    }
    expect(isValid).toBe(true);
  });

  it('should fail if "sections" is missing from props', () => {
    const invalidAccordion = {
      uid: 'acc-3',
      type: 'accordion',
      kind: 'layout',
      children: [],
      props: {
        singleOpen: true,
      },
    };

    const isValid = validate(invalidAccordion);
    // Here we WANT it to fail, so we don't log unless isValid is true
    expect(isValid).toBe(false);
    expect(validate.errors?.[0].message).toContain("must have required property 'sections'");
  });

  it('should validate i18n localizable labels in sections', () => {
    const i18nAccordion = {
      uid: 'acc-4',
      type: 'accordion',
      kind: 'layout',
      children: [],
      props: {
        sections: [
          {
            uid: 's1',
            label: { key: 'form.accordion.section1', default: 'Fallback Label' },
          },
        ],
      },
    };

    const isValid = validate(i18nAccordion);
    if (!isValid) logValidationErrors(validate, i18nAccordion);
    expect(isValid).toBe(true);
  });

  it('should fail on invalid renderMode enum', () => {
    const invalidMode = {
      uid: 'acc-5',
      type: 'accordion',
      kind: 'layout',
      children: [],
      props: {
        sections: [{ uid: 's1', label: 'L' }],
        renderMode: 'on-demand', // Expected: 'all' | 'activeOnly' | 'lazy'
      },
    };

    const isValid = validate(invalidMode);
    expect(isValid).toBe(false);
    const hasEnumError = validate.errors?.some((e) => e.keyword === 'enum');
    expect(hasEnumError).toBe(true);
  });
});
