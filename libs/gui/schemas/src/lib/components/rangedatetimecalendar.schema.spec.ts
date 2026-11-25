import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/rangedatetimecalendar.schema.json';

describe('RangeDateTimeCalendar schema validation', () => {
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
    it('should validate a minimum valid rangeDateTimeCalendar definition', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'input', type: 'rangeDateTimeCalendar', path: 'range' }],
      });
      expectValid(formDef.form.children[0]);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'input',
            type: 'rangeDateTimeCalendar',
            path: 'range',
            label: 'Range',
            props: {
              hint: 'Pick your rental',
              prevMonthIcon: 'chevron-left',
              nextMonthIcon: 'chevron-right',
              prevMonthAriaLabel: 'Previous month',
              nextMonthAriaLabel: 'Next month',
              selectYearAriaLabel: 'Select year',
              yearGridAriaLabel: 'Years',
              dayFormat: 'numeric',
              weekdayFormat: 'short',
              monthFormat: 'long',
              numberOfMonths: 2,
              hourFormat: '24',
              minuteStep: 30,
              allowCustomTime: true,
              startTimeLabel: 'Pick-up',
              endTimeLabel: 'Return',
              minDateTime: '2026-01-01T08:00:00',
              maxDateTime: '2026-12-31T20:00:00',
              minDateTimeMessage: 'Too early',
              maxDateTimeMessage: 'Too late',
              disabledRanges: [
                {
                  start: '2026-03-10T12:00:00',
                  end: '2026-03-10T14:00:00',
                },
              ],
              disabledRangeMessage: 'Closed then',
              noAvailableTimesMessage: 'No times left',
              incompleteMessage: 'Finish the range',
              disabledDayCountAriaLabel: '{count} closed spans',
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
            type: 'rangeDateTimeCalendar',
            path: 'range',
            props: {
              'hint.mobile': 'Pick a range',
              disabledRangeMessage: {
                key: 'range.disabledRangeMessage',
                default: 'Not that range',
              },
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
            type: 'rangeDateTimeCalendar',
            path: 'range',
            defaultValue: { start: '2026-03-02T09:00:00', end: '2026-03-06T17:00:00' },
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
            type: 'rangeDateTimeCalendar',
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
      type: 'rangeDateTimeCalendar',
      path: 'range',
      ...extra,
    });

    it('should fail on a defaultValue without an end', () => {
      expect(validate(widget({ defaultValue: { start: '2026-03-02T09:00:00' } }))).toBe(false);
    });

    it('should fail on a list of ranges, the multiRange value', () => {
      expect(
        validate(
          widget({ defaultValue: [{ start: '2026-03-02T09:00:00', end: '2026-03-06T17:00:00' }] }),
        ),
      ).toBe(false);
    });

    it.each(['allowEdit', 'removePillAriaLabel'])(
      'should fail on %s, a prop of the multiRange widgets only',
      (prop) => {
        expect(validate(widget({ props: { [prop]: true } }))).toBe(false);
      },
    );
  });
});
