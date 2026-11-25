import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/spinner.schema.json';

describe('Spinner schema validation', () => {
  let validate: GetSchema;

  beforeEach(() => {
    const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
  });

  const expectValid = (widget: unknown) => {
    const isValid = validate(widget);
    if (!isValid) specValidationErrorsLogger(validate, widget);
    expect(isValid).toBe(true);
  };

  const expectError = (widget: unknown, error: Record<string, unknown>) => {
    expect(validate(widget)).toBe(false);
    expect(validate.errors).toEqual(expect.arrayContaining([expect.objectContaining(error)]));
  };

  describe('Valid configurations', () => {
    it('validates a spinner without props, which is decorative', () => {
      const formDef = golemForm().create({ form: [{ kind: 'display', type: 'spinner' }] });
      expectValid(formDef.form.children[0]);
    });

    it('validates a spinner with a translated label, shown while a state holds', () => {
      const formDef = golemForm().create({
        states: { loading: '$form.loading === true' },
        form: [
          {
            uid: 'wait',
            kind: 'display',
            type: 'spinner',
            include: { in: ['loading'] },
            props: { label: { key: 'results.loading', default: 'Loading results' } },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });
  });

  describe('Invalid configurations', () => {
    it('rejects an unknown prop', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'spinner',
            // @ts-expect-error Expected, the spinner has no diameter: its size follows the text.
            props: { diameter: 24 },
          },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'additionalProperties',
        params: { additionalProperty: 'diameter' },
      });
    });

    it('rejects a spinner with a path', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, a display widget has no path.
          { kind: 'display', type: 'spinner', path: 'loading' },
        ],
      });
      expectError(formDef.form.children[0], { keyword: 'unevaluatedProperties' });
    });
  });
});
