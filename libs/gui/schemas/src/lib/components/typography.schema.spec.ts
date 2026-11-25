import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/typography.schema.json';

describe('Typography schema validation', () => {
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
    it('validates a minimal typography, which is body text', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'display', type: 'typography', props: { text: 'Prices include taxes.' } }],
      });
      expectValid(formDef.form.children[0]);
    });

    it('validates every variant, a state override and a translation key', () => {
      for (const variant of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small'] as const) {
        const formDef = golemForm().create({
          states: { done: '$form.done === true' },
          form: [
            {
              kind: 'display',
              type: 'typography',
              props: {
                text: { key: 'booking.title', default: 'Your booking' },
                variant,
                'text.done': 'Booking confirmed',
              },
            },
          ],
        });
        expectValid(formDef.form.children[0]);
      }
    });
  });

  describe('Invalid configurations', () => {
    it('rejects a typography without text', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "props.text" is missing.
          { kind: 'display', type: 'typography', props: { variant: 'h2' } },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'required',
        params: { missingProperty: 'text' },
      });
    });

    it('rejects an unknown variant', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'typography',
            // @ts-expect-error Expected, there is no lead variant.
            props: { text: 'Welcome', variant: 'lead' },
          },
        ],
      });
      expectError(formDef.form.children[0], { keyword: 'enum', instancePath: '/props/variant' });
    });

    it('rejects markup props it does not have', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'typography',
            // @ts-expect-error Expected, typography has no md: that is markdownText.
            props: { text: 'Welcome', md: '**Welcome**' },
          },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'additionalProperties',
        params: { additionalProperty: 'md' },
      });
    });
  });
});
