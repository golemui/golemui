import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/rangecalendar.schema.json';

describe('RangeCalendar schema validation', () => {
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
    it('should validate a minimum valid rangecalendar definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'range-1',
            path: 'dates',
            kind: 'input',
            type: 'rangeCalendar',
            props: {},
          },
        ],
      });

      const validRangeCalendar = formDef.form.children[0];
      const isValid = validate(validRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRangeCalendar);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'range-1',
            path: 'dates',
            kind: 'input',
            type: 'rangeCalendar',
            props: {
              hint: 'Select the date range',
              prevMonthIcon: 'left-arrow',
              nextMonthIcon: 'right-arrow',
              prevMonthAriaLabel: 'Previous month',
              nextMonthAriaLabel: 'Next month',
              dayFormat: '2-digit',
              weekdayFormat: 'short',
              monthFormat: 'long',
              minDate: '2023-01-01',
              maxDate: '2025-12-31',
              numberOfMonths: 2,
            },
          },
        ],
      });

      const validRangeCalendar = formDef.form.children[0];
      const isValid = validate(validRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRangeCalendar);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'range-1',
            path: 'dates',
            kind: 'input',
            type: 'rangeCalendar',
            props: {
              'hint.hasError': 'Required range',
              'numberOfMonths.isDesktop': 3,
            },
          },
        ],
      });

      const stateScopedRangeCalendar = formDef.form.children[0];
      const isValid = validate(stateScopedRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedRangeCalendar);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'range-1',
            path: 'dates',
            kind: 'input',
            type: 'rangeCalendar',
            props: {
              hint: { key: 'range.hint', default: 'Hint' },
              prevMonthAriaLabel: { key: 'range.prev', default: 'Previous' },
            },
          },
        ],
      });

      const i18nRangeCalendar = formDef.form.children[0];
      const isValid = validate(i18nRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nRangeCalendar);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate an array validator with required and item count constraints', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dates',
            kind: 'input',
            type: 'rangeCalendar',
            props: {},
            validator: {
              type: 'array',
              required: true,
              minItems: 2,
              maxItems: 5,
              messages: {
                required: 'Please select a date range',
                minItems: 'Select at least 2 dates',
                maxItems: 'You can select at most 5 dates',
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

    it('should validate an array validator with i18n messages', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dates',
            kind: 'input',
            type: 'rangeCalendar',
            props: {},
            validator: {
              type: 'array',
              required: true,
              minItems: 2,
              messages: {
                required: { key: 'validation.dates.required' },
                minItems: { key: 'validation.dates.minItems', default: 'Select at least 2 dates' },
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
    it('should fail on invalid type for numberOfMonths', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, numberOfMonths should be a number
          {
            uid: 'range-1',
            path: 'dates',
            kind: 'input',
            type: 'rangeCalendar',
            props: {
              numberOfMonths: 'two',
            },
          },
        ],
      });

      const invalidRangeCalendar = formDef.form.children[0];
      const isValid = validate(invalidRangeCalendar);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'type' && e.instancePath === '/props/numberOfMonths',
        ),
      ).toBe(true);
    });
  });
});
