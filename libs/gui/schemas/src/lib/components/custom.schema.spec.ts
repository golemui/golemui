import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import commonSchema from '../common.schema.json';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/custom.schema.json';
const FORM_WIDGET_REF = 'https://golemui.com/schemas/form.schema.json#/$defs/formWidget';

describe('Custom widget schema validation', () => {
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
    it('should validate a custom input widget with an open props bag', () => {
      const widget = {
        kind: 'input',
        type: 'matTextInput',
        path: 'user.email',
        label: 'Email',
        props: { appearance: 'outline', anything: 123, nested: { ok: true } },
      };

      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a custom display widget', () => {
      const widget = { kind: 'display', type: 'heading', props: { text: 'Hello', level: 1 } };

      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a custom action widget', () => {
      const widget = {
        kind: 'action',
        type: 'matButton',
        label: 'Send',
        props: { color: 'primary' },
      };

      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a custom layout widget with children', () => {
      const widget = {
        kind: 'layout',
        type: 'card',
        props: { elevation: 2 },
        children: [{ kind: 'input', type: 'textinput', path: 'name', props: {} }],
      };

      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should accept arbitrary props keys and shapes (loose props)', () => {
      const widget = {
        kind: 'display',
        type: 'fancyChart',
        props: { series: [1, 2, 3], options: { legend: true }, 'data-id': 'x' },
      };

      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should reject unknown root-level keys (strict root)', () => {
      // `level` belongs inside `props`, not at the root.
      const widget = { kind: 'display', type: 'heading', level: 1, props: { text: 'Hi' } };
      expect(validate(widget)).toBe(false);
    });

    it('should reject a custom input without a path', () => {
      const widget = { kind: 'input', type: 'matTextInput', props: {} };
      expect(validate(widget)).toBe(false);
    });

    it('should reject a custom layout without children', () => {
      const widget = { kind: 'layout', type: 'card', props: {} };
      expect(validate(widget)).toBe(false);
    });

    it('should not match a built-in widget type', () => {
      const widget = { kind: 'input', type: 'textinput', path: 'name', props: {} };
      expect(validate(widget)).toBe(false);
    });
  });

  describe('formWidget oneOf resolution', () => {
    let validateFormWidget: GetSchema;

    beforeEach(() => {
      validateFormWidget = ajv.compile({ $ref: FORM_WIDGET_REF });
    });

    it('should resolve a built-in widget to its strict schema', () => {
      const widget = { kind: 'input', type: 'textinput', path: 'name', props: {} };
      const isValid = validateFormWidget(widget);
      if (!isValid) {
        specValidationErrorsLogger(validateFormWidget, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should resolve an unknown widget type to the custom fallback', () => {
      const widget = { kind: 'display', type: 'heading', props: { text: 'Hi' } };
      const isValid = validateFormWidget(widget);
      if (!isValid) {
        specValidationErrorsLogger(validateFormWidget, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should not mask a typo in a built-in widget (matches zero branches)', () => {
      // `icon` must be a string on a built-in textinput. The custom branch excludes built-in
      // types, so this matches no branch and errors instead of silently passing as custom.
      const widget = { kind: 'input', type: 'textinput', path: 'name', props: { icon: 123 } };
      expect(validateFormWidget(widget)).toBe(false);
    });
  });

  describe('knownWidgetTypes enum stays in sync with built-in component schemas', () => {
    it('should match every built-in component schema type const', () => {
      // @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
      const componentSchemas: Record<string, any> = import.meta.glob('./*.schema.json', {
        eager: true,
        import: 'default',
      });

      const builtInTypes = new Set<string>();
      for (const path in componentSchemas) {
        const typeConst = componentSchemas[path]?.properties?.type?.const;
        if (typeof typeConst === 'string') {
          builtInTypes.add(typeConst);
        }
      }

      const enumTypes = new Set<string>(commonSchema.$defs.knownWidgetTypes.enum as string[]);

      expect([...enumTypes].sort()).toEqual([...builtInTypes].sort());
    });
  });
});
