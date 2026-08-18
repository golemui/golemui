import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/rangedateinput.schema.json';

describe('RangeDateInput schema validation', () => {
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
    it('should validate a minimum valid rangeDateInput definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDateInput',
            props: {},
          },
        ],
      });

      const validRangeDateInput = formDef.form.children[0];
      const isValid = validate(validRangeDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRangeDateInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDateInput',
            props: {
              dayAriaLabel: 'Day',
              monthAriaLabel: 'Month',
              yearAriaLabel: 'Year',
              hint: 'Select date ranges',
              icon: 'calendar',
              separator: '-',
              removePillAriaLabel: 'Remove date',
              startDateAriaLabel: 'Start date',
              endDateAriaLabel: 'End date',
              incompleteMessage: 'Incomplete date',
            },
          },
        ],
      });

      const validRangeDateInput = formDef.form.children[0];
      const isValid = validate(validRangeDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validRangeDateInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDateInput',
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

      const stateScopedRangeDateInput = formDef.form.children[0];
      const isValid = validate(stateScopedRangeDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedRangeDateInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDateInput',
            props: {
              hint: { key: 'rdi.hint', default: 'Hint' },
              separator: { key: 'rdi.separator', default: '-' },
              removePillAriaLabel: { key: 'rdi.removePill', default: 'Remove date' },
              startDateAriaLabel: { key: 'rdi.startDate', default: 'Start date' },
              endDateAriaLabel: { key: 'rdi.endDate', default: 'End date' },
            },
          },
        ],
      });

      const i18nRangeDateInput = formDef.form.children[0];
      const isValid = validate(i18nRangeDateInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nRangeDateInput);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate an array validator with required and minItems', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDateInput',
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
            uid: 'rdi-1',
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDateInput',
            props: {
              icon: 123,
            },
          },
        ],
      });

      const invalidRangeDateInput = formDef.form.children[0];
      const isValid = validate(invalidRangeDateInput);
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
            type: 'rangeDateInput',
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
          // @ts-expect-error Expected, allowEdit should be a boolean
          {
            path: 'dateRanges',
            kind: 'input',
            type: 'rangeDateInput',
            props: {
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
