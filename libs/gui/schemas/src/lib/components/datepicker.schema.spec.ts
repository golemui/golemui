import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import { golemForm } from '@golemui/gui-shared/internals';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/datepicker.schema.json';

describe('Datepicker schema validation', () => {
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
    it('should validate a minimum valid datepicker definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dp-1',
            path: 'bday',
            kind: 'input',
            type: 'datePicker',
            props: {},
          },
        ],
      });

      const validDatepicker = formDef.form.children[0];
      const isValid = validate(validDatepicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDatepicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dp-1',
            path: 'bday',
            kind: 'input',
            type: 'datePicker',
            props: {
              toggleAriaLabel: 'Open picker',
              selectYearAriaLabel: 'Choose year',
              yearGridAriaLabel: 'Years',
              dayAriaLabel: 'Day',
              monthAriaLabel: 'Month',
              yearAriaLabel: 'Year',
              hint: 'Pick a date',
              icon: 'calendar',
              dayFormat: '2-digit',
              monthFormat: 'long',
              weekdayFormat: 'short',
              minDate: '2023-01-01',
              maxDate: '2025-12-31',
              numberOfMonths: 2,
              disabledRanges: [{ start: '2023-12-25', end: '2024-01-01' }, { start: '2024-07-04' }],
            },
          },
        ],
      });

      const validDatepicker = formDef.form.children[0];
      const isValid = validate(validDatepicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDatepicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dp-1',
            path: 'bday',
            kind: 'input',
            type: 'datePicker',
            props: {
              'hint.hasError': 'Date required',
            },
          },
        ],
      });

      const stateScopedDatepicker = formDef.form.children[0];
      const isValid = validate(stateScopedDatepicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedDatepicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dp-1',
            path: 'bday',
            kind: 'input',
            type: 'datePicker',
            props: {
              hint: { key: 'dp.hint', default: 'Hint' },
            },
          },
        ],
      });

      const i18nDatepicker = formDef.form.children[0];
      const isValid = validate(i18nDatepicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nDatepicker);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a string validator with format: date', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'bday',
            kind: 'input',
            type: 'datePicker',
            props: {},
            validator: {
              type: 'string',
              required: true,
              format: 'date',
              messages: {
                required: 'Date is required',
                format: { key: 'validation.bday.format', default: 'Enter a valid date' },
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
            uid: 'dp-1',
            path: 'bday',
            kind: 'input',
            type: 'datePicker',
            props: {
              icon: 123,
            },
          },
        ],
      });

      const invalidDatepicker = formDef.form.children[0];
      const isValid = validate(invalidDatepicker);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/icon'),
      ).toBe(true);
    });

    it('should reject `placeholder` — date inputs use locale-derived placeholders', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'dp-1',
            path: 'bday',
            kind: 'input',
            type: 'datePicker',
            // @ts-expect-error Expected — placeholder is not a valid prop on datePicker
            props: { placeholder: 'dd/mm/yyyy' },
          },
        ],
      });

      const invalidDatepicker = formDef.form.children[0];
      const isValid = validate(invalidDatepicker);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) =>
            e.keyword === 'additionalProperties' &&
            (e.params as { additionalProperty?: string }).additionalProperty === 'placeholder',
        ),
      ).toBe(true);
    });
  });
});
