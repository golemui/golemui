import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/rangetimeinput.schema.json';

describe('RangeTimeInput schema validation', () => {
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
    it('should validate a minimum valid rangeTimeInput definition', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'input', type: 'rangeTimeInput', path: 'range' }],
      });
      expectValid(formDef.form.children[0]);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'input',
            type: 'rangeTimeInput',
            path: 'range',
            label: 'Range',
            props: {
              hint: 'Opening hours',
              icon: 'schedule',
              separator: 'to',
              startTimeAriaLabel: 'Opens',
              endTimeAriaLabel: 'Closes',
              hourFormat: '24',
              minuteStep: 15,
              minTime: '08:00:00',
              maxTime: '20:00:00',
              minTimeMessage: 'Too early',
              maxTimeMessage: 'Too late',
              rangeOrderMessage: 'Closes before it opens',
              incompleteMessage: 'Finish the range',
              hourAriaLabel: 'Hour',
              minuteAriaLabel: 'Minute',
              dayPeriodAriaLabel: 'AM/PM',
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
            type: 'rangeTimeInput',
            path: 'range',
            props: {
              'hint.mobile': 'Pick a range',
              rangeOrderMessage: { key: 'range.rangeOrderMessage', default: 'Not that range' },
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
            type: 'rangeTimeInput',
            path: 'range',
            defaultValue: { start: '09:00:00', end: '17:00:00' },
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
            type: 'rangeTimeInput',
            path: 'range',
            validator: {
              type: 'range',
              required: true,
              messages: { required: 'Pick a range', invalid: 'Pick a start and an end' },
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
      type: 'rangeTimeInput',
      path: 'range',
      ...extra,
    });

    it('should fail on a defaultValue without an end', () => {
      expect(validate(widget({ defaultValue: { start: '09:00:00' } }))).toBe(false);
    });

    it('should fail on a list of ranges, the multiRange value', () => {
      expect(validate(widget({ defaultValue: [{ start: '09:00:00', end: '17:00:00' }] }))).toBe(
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
