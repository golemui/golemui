import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/multirangedatepicker.schema.json';

describe('MultiRangeDatePicker schema validation', () => {
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
    it('should validate a minimum valid multiRangeDatePicker definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'multiRangeDatePicker',
            props: {},
          },
        ],
      });

      const validMultiRangeDatePicker = formDef.form.children[0];
      const isValid = validate(validMultiRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validMultiRangeDatePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'multiRangeDatePicker',
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
              incompleteMessage: 'Incomplete date',
            },
          },
        ],
      });

      const validMultiRangeDatePicker = formDef.form.children[0];
      const isValid = validate(validMultiRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validMultiRangeDatePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'multiRangeDatePicker',
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

      const stateScopedMultiRangeDatePicker = formDef.form.children[0];
      const isValid = validate(stateScopedMultiRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedMultiRangeDatePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'multiRangeDatePicker',
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

      const i18nMultiRangeDatePicker = formDef.form.children[0];
      const isValid = validate(i18nMultiRangeDatePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nMultiRangeDatePicker);
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
            type: 'multiRangeDatePicker',
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
          {
            uid: 'rdp-1',
            path: 'dateRanges',
            kind: 'input',
            type: 'multiRangeDatePicker',
            props: {
              // @ts-expect-error Expected, icon should be a string
              icon: 123,
            },
          },
        ],
      });

      const invalidMultiRangeDatePicker = formDef.form.children[0];
      const isValid = validate(invalidMultiRangeDatePicker);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/icon'),
      ).toBe(true);
    });
  });
  describe('allowEdit editing props', () => {
    it('should validate the editing props, plain, scoped and localizable', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'multiRangeDatePicker',
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
            path: 'dateRanges',
            kind: 'input',
            type: 'multiRangeDatePicker',
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
});
