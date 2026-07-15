import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/components/rangedatetimeinput.schema.json';

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
              hint: 'Select date-time ranges',
              icon: 'schedule',
              separator: '-',
              removePillAriaLabel: 'Remove date-time',
              startDateTimeAriaLabel: 'Start date-time',
              endDateTimeAriaLabel: 'End date-time',
              hourFormat: '24',
              minuteStep: 15,
              invalidDateMessage: 'Invalid date',
              minDate: '2026-01-01',
              maxDate: '2026-12-31',
              minTime: '09:00:00',
              maxTime: '18:00:00',
              minDateMessage: 'Too early a date',
              maxDateMessage: 'Too late a date',
              minTimeMessage: 'Too early',
              maxTimeMessage: 'Too late',
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
              'minTime.isMobile': '10:00:00',
              'maxTime.isMobile': '16:00:00',
              'minDateMessage.hasError': 'Too early',
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
    it('should fail on a malformed minTime', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rdti-1',
            path: 'dateTimeRanges',
            kind: 'input',
            type: 'rangeDateTimeInput',
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
