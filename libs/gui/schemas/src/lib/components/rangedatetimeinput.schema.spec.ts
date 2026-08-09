import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/rangedatetimeinput.schema.json';

describe('RangeDateTimeInput schema validation', () => {
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
    it('should validate a minimum valid rangeDateTimeInput definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeInput',
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
            type: 'rangeDateTimeInput',
            props: {
              dayAriaLabel: 'Day',
              monthAriaLabel: 'Month',
              yearAriaLabel: 'Year',
              hourAriaLabel: 'Hour',
              minuteAriaLabel: 'Minute',
              dayPeriodAriaLabel: 'AM/PM',
              hint: 'Select date-time ranges',
              icon: 'schedule',
              separator: '-',
              removePillAriaLabel: 'Remove date-time',
              startDateTimeAriaLabel: 'Start date-time',
              endDateTimeAriaLabel: 'End date-time',
              hourFormat: '24',
              minuteStep: 15,
              invalidDateMessage: 'Invalid date',
              minDateTime: '2026-01-01T09:00:00',
              maxDateTime: '2026-12-31T18:00:00',
              minDateTimeMessage: 'Too early',
              maxDateTimeMessage: 'Too late',
              incompleteMessage: 'Incomplete date-time',
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
            type: 'rangeDateTimeInput',
            props: {
              'hint.hasError': 'Date-time ranges required',
              'minDateTime.isMobile': '2026-01-01T10:00:00',
              'maxDateTime.isMobile': '2026-12-31T16:00:00',
              'minDateTimeMessage.hasError': 'Too early',
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

  describe('validator field', () => {
    it('should validate an array validator with required and minItems', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeInput',
            props: {},
            validator: {
              type: 'array',
              required: true,
              minItems: 1,
              messages: {
                required: 'Date-time range is required',
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
    it('should reject the date-only bound it replaced', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rdti-1',
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeInput',
            props: {
              // Each endpoint is an instant, so it is bounded by minDateTime /
              // maxDateTime; a date-only bound cannot express the time of day.
              // @ts-expect-error Expected, minDate is not a rangeDateTimeInput prop
              minDate: '2026-01-01',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
    });

    it('should reject the time-of-day bound it replaced', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rdti-2',
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeInput',
            props: {
              // A recurring daily window is a different constraint from an
              // instant bound; it belongs to the date-time calendar, not here.
              // @ts-expect-error Expected, minTime is not a rangeDateTimeInput prop
              minTime: '09:00:00',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
    });

    it('should fail on invalid type for icon', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, icon should be a string
          {
            uid: 'rdti-2',
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeInput',
            props: {
              icon: 123,
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/icon'),
      ).toBe(true);
    });
  });
});
