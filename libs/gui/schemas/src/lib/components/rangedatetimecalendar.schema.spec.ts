import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/components/rangedatetimecalendar.schema.json';

describe('RangeDateTimeCalendar schema validation', () => {
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
    it('should validate a minimum valid rangeDateTimeCalendar definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeCalendar',
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
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeCalendar',
            props: {
              hint: 'Pick date-time ranges',
              hourFormat: '24',
              minuteStep: 15,
              allowCustomTime: true,
              startTimeLabel: 'Check-in',
              endTimeLabel: 'Check-out',
              numberOfMonths: 2,
              removePillAriaLabel: 'Remove range',
              minDateTime: '2026-01-01T09:00:00',
              maxDateTime: '2026-12-31T18:00:00',
              minDateTimeMessage: 'Too early',
              maxDateTimeMessage: 'Too late',
              disabledRanges: [{ start: '2026-02-17T10:00:00', end: '2026-02-17T12:00:00' }],
              disabledRangeMessage: 'Overlaps a closed period',
              noAvailableTimesMessage: 'No slots',
              dayCountAriaLabel: '{count} ranges',
              disabledDayCountAriaLabel: '{count} disabled ranges',
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

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeCalendar',
            props: {
              'minDateTime.isMobile': '2026-01-01T10:00:00',
              'disabledRangeMessage.hasError': 'Closed',
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
    it('should reject the date-only bound it does not support', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rdtc-1',
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeCalendar',
            props: {
              // Endpoints are instants — bounds are minDateTime/maxDateTime.
              // @ts-expect-error Expected, minDate is not a rangeDateTimeCalendar prop
              minDate: '2026-01-01',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
    });

    it('should reject the time-of-day bound it does not support', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rdtc-2',
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeCalendar',
            props: {
              // A recurring daily window cannot constrain a multi-day span.
              // @ts-expect-error Expected, minTime is not a rangeDateTimeCalendar prop
              minTime: '09:00:00',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
    });

    it('should fail on invalid type for allowCustomTime', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rdtc-3',
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeCalendar',
            props: {
              // @ts-expect-error Expected, allowCustomTime should be a boolean
              allowCustomTime: 'yes',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'type' && e.instancePath === '/props/allowCustomTime',
        ),
      ).toBe(true);
    });
  });
});
