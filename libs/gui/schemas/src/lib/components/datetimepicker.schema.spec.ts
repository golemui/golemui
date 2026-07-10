import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/datetimepicker.schema.json';

describe('DateTimePicker schema validation', () => {
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
    it('should validate a minimum valid dateTimePicker definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'appointmentAt',
            kind: 'input',
            type: 'dateTimePicker',
            props: {},
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'appointmentAt',
            kind: 'input',
            type: 'dateTimePicker',
            props: {
              hint: 'Pick a slot',
              icon: 'calendar_month',
              prevMonthIcon: 'chevron_left',
              nextMonthIcon: 'chevron_right',
              prevMonthAriaLabel: 'Previous month',
              nextMonthAriaLabel: 'Next month',
              dayFormat: 'numeric',
              weekdayFormat: 'short',
              monthFormat: 'long',
              minDate: '2026-02-01',
              maxDate: '2026-03-31',
              numberOfMonths: 1,
              disabledRanges: [{ start: '2026-02-09', end: '2026-02-10' }],
              hourFormat: '24',
              minuteStep: 30,
              minTime: '09:00:00',
              maxTime: '18:00:00',
              disabledTimeRanges: [
                { start: '13:00:00', end: '14:00:00', weekdays: [1, 2, 3, 4, 5] },
                { start: '09:00:00', end: '10:30:00', date: '2026-02-13' },
                { start: '17:00:00', end: '18:00:00' },
              ],
              allowCustomTime: true,
              invalidDateMessage: 'That date does not exist',
              minTimeMessage: 'Too early',
              maxTimeMessage: { key: 'dtp.max', default: 'Too late' },
              disabledTimeRangeMessage: 'Unavailable slot',
              noAvailableTimesMessage: 'No slots today',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a required date-time validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'appointmentAt',
            kind: 'input',
            type: 'dateTimePicker',
            props: {},
            validator: {
              type: 'string',
              required: true,
              format: 'date-time',
              messages: {
                required: 'Appointment time is required',
              },
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) {
        specValidationErrorsLogger(validate, widget);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on a malformed minTime', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dtp-1',
            path: 'appointmentAt',
            kind: 'input',
            type: 'dateTimePicker',
            props: {
              minTime: '25:00:00',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(validate.errors?.some((e) => e.instancePath === '/props/minTime')).toBe(true);
    });

    it('should fail on an out-of-range weekday in a disabled time range', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dtp-2',
            path: 'appointmentAt',
            kind: 'input',
            type: 'dateTimePicker',
            props: {
              // 7 is invalid: weekdays follow getDay() numbering (0=Sunday … 6=Saturday)
              disabledTimeRanges: [{ start: '13:00:00', end: '14:00:00', weekdays: [7] }],
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(validate.errors?.some((e) => e.keyword === 'maximum')).toBe(true);
    });

    it('should fail on an unknown prop', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, itemRenderer is not a dateTimePicker prop
          {
            uid: 'dtp-3',
            path: 'appointmentAt',
            kind: 'input',
            type: 'dateTimePicker',
            props: {
              itemRenderer: 'nope',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(validate.errors?.some((e) => e.keyword === 'additionalProperties')).toBe(true);
    });
  });
});
