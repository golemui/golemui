import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/rangedateinput.schema.json';

describe('RangeDateInput schema validation', () => {
  let ajv: Ajv2020;
  let validate: GetSchema;

  beforeEach(() => {
    ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) {
      throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
    }
  });

  const expectValid = (widget: unknown) => {
    const isValid = validate(widget);
    if (!isValid) specValidationErrorsLogger(validate, widget);
    expect(isValid).toBe(true);
  };

  describe('Valid configurations', () => {
    it('should validate a minimum valid rangeDateInput definition', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'input', type: 'rangeDateInput', path: 'stay' }],
      });
      expectValid(formDef.form.children[0]);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'input',
            type: 'rangeDateInput',
            path: 'stay',
            label: 'Stay',
            props: {
              invalidDateMessage: 'No such day',
              incompleteMessage: 'Finish the range',
              hint: 'Your trip',
              icon: 'event',
              separator: 'to',
              startDateAriaLabel: 'Departure',
              endDateAriaLabel: 'Return',
              dayAriaLabel: 'Day',
              monthAriaLabel: 'Month',
              yearAriaLabel: 'Year',
            },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });

    it('should validate state-scoped and localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'input',
            type: 'rangeDateInput',
            path: 'stay',
            props: {
              'hint.mobile': 'Tap two days',
              incompleteMessage: { key: 'stay.incompleteMessage', default: 'Not that range' },
            },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });

    it('should validate a defaultValue with both ends', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'input',
            type: 'rangeDateInput',
            path: 'stay',
            defaultValue: { start: '2026-03-02', end: '2026-03-06' },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });
  });

  describe('validator field', () => {
    it('should validate a range validator with required and its messages', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'input',
            type: 'rangeDateInput',
            path: 'stay',
            validator: {
              type: 'range',
              required: true,
              messages: { required: 'Pick your stay', invalid: 'Pick a start and an end' },
            },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });
  });

  describe('Invalid configurations', () => {
    const widget = (extra: Record<string, unknown>) => ({
      kind: 'input',
      type: 'rangeDateInput',
      path: 'stay',
      ...extra,
    });

    it('should fail on a defaultValue without an end', () => {
      expect(validate(widget({ defaultValue: { start: '2026-03-02' } }))).toBe(false);
    });

    it('should fail on a list of ranges, the multiRange value', () => {
      expect(validate(widget({ defaultValue: [{ start: '2026-03-02', end: '2026-03-06' }] }))).toBe(
        false,
      );
    });

    it.each(['allowEdit', 'removePillAriaLabel'])(
      'should fail on %s, a prop of the multiRange widgets only',
      (prop) => {
        expect(validate(widget({ props: { [prop]: true } }))).toBe(false);
      },
    );
  });
});
