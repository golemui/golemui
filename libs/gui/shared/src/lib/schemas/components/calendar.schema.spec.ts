import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/calendar.schema.json';

describe('Calendar schema validation', () => {
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
    it('should validate a minimum valid calendar definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingDate',
            kind: 'input',
            type: 'calendar',
            props: {},
          },
        ],
      });

      const validCalendar = formDef.form.children[0];
      const isValid = validate(validCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, validCalendar);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingDate',
            kind: 'input',
            type: 'calendar',
            props: {
              hint: 'Select a date',
              prevMonthIcon: 'left',
              nextMonthIcon: 'right',
              prevMonthAriaLabel: 'Previous',
              nextMonthAriaLabel: 'Next',
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

      const validCalendar = formDef.form.children[0];
      const isValid = validate(validCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, validCalendar);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'cal-1',
            path: 'meetingDate',
            kind: 'input',
            type: 'calendar',
            props: {
              'hint.hasError': 'Required',
              'numberOfMonths.isDesktop': 3,
            },
          },
        ],
      });

      const stateScopedCalendar = formDef.form.children[0];
      const isValid = validate(stateScopedCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedCalendar);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingDate',
            kind: 'input',
            type: 'calendar',
            props: {
              hint: { key: 'cal.hint', default: 'Hint' },
              prevMonthAriaLabel: { key: 'cal.prev', default: 'Previous' },
            },
          },
        ],
      });

      const i18nCalendar = formDef.form.children[0];
      const isValid = validate(i18nCalendar);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nCalendar);
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
            uid: 'cal-1',
            path: 'meetingDate',
            kind: 'input',
            type: 'calendar',
            props: {
              numberOfMonths: 'two',
            },
          },
        ],
      });

      const invalidCalendar = formDef.form.children[0];
      const isValid = validate(invalidCalendar);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'type' && e.instancePath === '/props/numberOfMonths',
        ),
      ).toBe(true);
    });
  });
});
