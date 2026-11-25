import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/multirangecalendar.schema.json';

describe('MultiRangeCalendar schema validation', () => {
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
    it('should validate a minimum valid multirangecalendar definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'range-1',
            path: 'dates',
            kind: 'input',
            type: 'multiRangeCalendar',
            props: {},
          },
        ],
      });

      const validMultiRangeCalendar = formDef.form.children[0];
      const isValid = validate(validMultiRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, validMultiRangeCalendar);
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
            type: 'multiRangeCalendar',
            props: {
              selectYearAriaLabel: 'Choose year',
              yearGridAriaLabel: 'Years',
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
              disabledRanges: [{ start: '2023-12-25', end: '2024-01-01' }, { start: '2024-07-04' }],
            },
          },
        ],
      });

      const validMultiRangeCalendar = formDef.form.children[0];
      const isValid = validate(validMultiRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, validMultiRangeCalendar);
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
            type: 'multiRangeCalendar',
            props: {
              'hint.hasError': 'Required range',
              'numberOfMonths.isDesktop': 3,
            },
          },
        ],
      });

      const stateScopedMultiRangeCalendar = formDef.form.children[0];
      const isValid = validate(stateScopedMultiRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedMultiRangeCalendar);
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
            type: 'multiRangeCalendar',
            props: {
              hint: { key: 'range.hint', default: 'Hint' },
              prevMonthAriaLabel: { key: 'range.prev', default: 'Previous' },
            },
          },
        ],
      });

      const i18nMultiRangeCalendar = formDef.form.children[0];
      const isValid = validate(i18nMultiRangeCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nMultiRangeCalendar);
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
            type: 'multiRangeCalendar',
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
            type: 'multiRangeCalendar',
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

  describe('allowEdit editing props', () => {
    it('should validate the editing props, plain, scoped and localizable', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dates',
            kind: 'input',
            type: 'multiRangeCalendar',
            props: {
              allowEdit: true,
              editLabel: 'Edit',
              editAriaLabel: { key: 'range.editRange', default: 'Edit range {label}' },
              confirmEditLabel: 'Confirm',
              cancelEditLabel: 'Cancel',
              editStartedMessage: 'Editing range {label}.',
              editCommittedMessage: 'Range updated to {label}.',
              editCancelledMessage: 'Edit cancelled.',
              'allowEdit.isDesktop': true,
              'editLabel.hasError': 'Edit',
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

    it('should fail on a non-boolean allowEdit', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dates',
            kind: 'input',
            type: 'multiRangeCalendar',
            props: {
              // @ts-expect-error Expected, allowEdit should be a boolean
              allowEdit: 'yes',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/allowEdit'),
      ).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid type for numberOfMonths', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'range-1',
            path: 'dates',
            kind: 'input',
            type: 'multiRangeCalendar',
            props: {
              // @ts-expect-error Expected, numberOfMonths should be a number
              numberOfMonths: 'two',
            },
          },
        ],
      });

      const invalidMultiRangeCalendar = formDef.form.children[0];
      const isValid = validate(invalidMultiRangeCalendar);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'type' && e.instancePath === '/props/numberOfMonths',
        ),
      ).toBe(true);
    });
  });
});
