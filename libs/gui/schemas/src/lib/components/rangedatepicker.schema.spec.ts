import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/rangedatepicker.schema.json';

describe('RangeDatePicker schema validation', () => {
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
    it('should validate a minimum valid rangeDatePicker definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDatePicker',
            props: {},
          },
        ],
      });

      const validRangeDatePicker = formDef.form.children[0];
      const isValid = validate(validRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRangeDatePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDatePicker',
            props: {
              toggleAriaLabel: 'Open picker',
              selectYearAriaLabel: 'Choose year',
              yearGridAriaLabel: 'Years',
              dayAriaLabel: 'Day',
              monthAriaLabel: 'Month',
              yearAriaLabel: 'Year',
              hint: 'Select date ranges',
              icon: 'calendar',
              separator: 'to',
              removePillAriaLabel: 'Remove range',
              startDateAriaLabel: 'Start date',
              endDateAriaLabel: 'End date',
              prevMonthIcon: 'chevron-left',
              nextMonthIcon: 'chevron-right',
              prevMonthAriaLabel: 'Previous month',
              nextMonthAriaLabel: 'Next month',
              dayFormat: '2-digit',
              weekdayFormat: 'short',
              monthFormat: 'long',
              minDate: '2024-01-01',
              maxDate: '2025-12-31',
              numberOfMonths: 2,
              disabledRanges: [{ start: '2024-12-25', end: '2025-01-01' }, { start: '2025-07-04' }],
            },
          },
        ],
      });

      const validRangeDatePicker = formDef.form.children[0];
      const isValid = validate(validRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRangeDatePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDatePicker',
            props: {
              'hint.hasError': 'Date ranges required',
              'separator.hasError': '~',
              'removePillAriaLabel.hasError': 'Remove',
              'startDateAriaLabel.hasError': 'From',
              'endDateAriaLabel.hasError': 'To',
            },
          },
        ],
      });

      const stateScopedRangeDatePicker = formDef.form.children[0];
      const isValid = validate(stateScopedRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedRangeDatePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDatePicker',
            props: {
              hint: { key: 'rdp.hint', default: 'Hint' },
              separator: { key: 'rdp.separator', default: 'to' },
              removePillAriaLabel: { key: 'rdp.removePill', default: 'Remove range' },
              startDateAriaLabel: { key: 'rdp.startDate', default: 'Start date' },
              endDateAriaLabel: { key: 'rdp.endDate', default: 'End date' },
              prevMonthAriaLabel: { key: 'rdp.prevMonth', default: 'Previous month' },
              nextMonthAriaLabel: { key: 'rdp.nextMonth', default: 'Next month' },
            },
          },
        ],
      });

      const i18nRangeDatePicker = formDef.form.children[0];
      const isValid = validate(i18nRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nRangeDatePicker);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate an array validator with required and item count constraints', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDatePicker',
            props: {},
            validator: {
              type: 'array',
              required: true,
              minItems: 2,
              maxItems: 2,
              messages: {
                required: 'Date range is required',
                minItems: {
                  key: 'validation.dateRanges.minItems',
                  default: 'Select start and end dates',
                },
                maxItems: 'Only a start and end date can be selected',
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
    it('should fail on invalid type for icon', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, icon should be a string
          {
            uid: 'rdp-1',
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDatePicker',
            props: {
              icon: 123,
            },
          },
        ],
      });

      const invalidRangeDatePicker = formDef.form.children[0];
      const isValid = validate(invalidRangeDatePicker);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/icon'),
      ).toBe(true);
    });
  });
});
