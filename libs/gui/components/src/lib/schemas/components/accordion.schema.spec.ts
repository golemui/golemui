import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import * as commonSchema from '../common.schema.json';
import * as formSchema from '../form.schema.json';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/accordion.schema.json';

/**
 * Utility to assemble and register all GolemUI schemas dynamically
 */
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
      strict: false,
      verbose: true,
    });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) {
      throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
    }
  });

  it('should validate a minimum valid accordion definition', () => {
    const validAccordion = {
      uid: 'acc-1',
      type: 'accordion',
      kind: 'layout',
      children: [{ type: 'text', kind: 'input', uid: 'child-1' }],
      props: {
        sections: [{ uid: 'section-1', label: 'General Info' }],
      },
    };

    const isValid = validate(validAccordion);
    console.log('isValid', isValid);
    expect(isValid).toBe(true);
  });

  it('should validate state-scoped properties (e.g. sections.registering)', () => {
    const stateScopedAccordion = {
      type: 'accordion',
      kind: 'layout',
      children: [{ type: 'text', kind: 'input', uid: 'c1' }],
      props: {
        sections: [{ uid: 's1', label: 'Basic' }],
        'sections.registering': [
          { uid: 's1', label: 'Registration Progress' },
          { uid: 's2', label: 'Security' },
        ],
        'singleOpen.mobile': true,
      },
    };

    const isValid = validate(stateScopedAccordion);
    expect(isValid).toBe(true);
  });

  it('should fail if "sections" is missing from props', () => {
    const invalidAccordion = {
      type: 'accordion',
      kind: 'layout',
      children: [{ type: 'text', kind: 'input' }],
      props: {
        singleOpen: true,
      },
    };

    const isValid = validate(invalidAccordion);
    expect(isValid).toBe(false);
    expect(validate.errors?.[0].message).toContain("must have required property 'sections'");
  });

  it('should fail if "kind" is not "layout"', () => {
    const invalidAccordion = {
      type: 'accordion',
      kind: 'input', // Wrong kind
      children: [{ type: 'text', kind: 'input' }],
      props: { sections: [{ uid: 's1', label: 'L' }] },
    };

    const isValid = validate(invalidAccordion);
    expect(isValid).toBe(false);
  });

  it('should validate i18n localizable labels in sections', () => {
    const i18nAccordion = {
      type: 'accordion',
      kind: 'layout',
      children: [{ type: 'text', kind: 'input' }],
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
    expect(isValid).toBe(true);
  });

  it('should validate renderMode enum values', () => {
    const validMode = {
      type: 'accordion',
      kind: 'layout',
      children: [{ type: 'text', kind: 'input' }],
      props: {
        sections: [{ uid: 's1', label: 'L' }],
        renderMode: 'activeOnly',
      },
    };

    const invalidMode = {
      ...validMode,
      props: { ...validMode.props, renderMode: 'on-demand' }, // Not in enum
    };

    expect(validate(validMode)).toBe(true);
    expect(validate(invalidMode)).toBe(false);
  });
});
