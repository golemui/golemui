import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/datetimeinput.schema.json';

describe('Datetimeinput schema validation', () => {
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
    it('should validate a minimum valid timeinput definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingAt',
            kind: 'input',
            type: 'dateTimeInput',
            props: {},
          },
        ],
      });

      const validDateTimeInput = formDef.form.children[0];
      const isValid = validate(validDateTimeInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDateTimeInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingAt',
            kind: 'input',
            type: 'dateTimeInput',
            props: {
              dayAriaLabel: 'Day',
              monthAriaLabel: 'Month',
              yearAriaLabel: 'Year',
              hourAriaLabel: 'Hour',
              minuteAriaLabel: 'Minute',
              dayPeriodAriaLabel: 'AM/PM',
              hint: 'Pick a time',
              icon: 'schedule',
              hourFormat: '24',
              minuteStep: 15,
            },
          },
        ],
      });

      const validDateTimeInput = formDef.form.children[0];
      const isValid = validate(validDateTimeInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, validDateTimeInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingAt',
            kind: 'input',
            type: 'dateTimeInput',
            props: {
              'hint.hasError': 'Time required',
            },
          },
        ],
      });

      const stateScopedDateTimeInput = formDef.form.children[0];
      const isValid = validate(stateScopedDateTimeInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, stateScopedDateTimeInput);
      }
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingAt',
            kind: 'input',
            type: 'dateTimeInput',
            props: {
              hint: { key: 'ti.hint', default: 'Hint' },
            },
          },
        ],
      });

      const i18nDateTimeInput = formDef.form.children[0];
      const isValid = validate(i18nDateTimeInput);
      if (!isValid) {
        specValidationErrorsLogger(validate, i18nDateTimeInput);
      }
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a required string validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingAt',
            kind: 'input',
            type: 'dateTimeInput',
            props: {},
            validator: {
              type: 'string',
              required: true,
              messages: {
                required: 'Meeting time is required',
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
    it('should fail on invalid hourFormat value', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, hourFormat must be '12' or '24'
          {
            uid: 'dti-1',
            path: 'meetingAt',
            kind: 'input',
            type: 'dateTimeInput',
            props: {
              hourFormat: '13',
            },
          },
        ],
      });

      const invalidDateTimeInput = formDef.form.children[0];
      const isValid = validate(invalidDateTimeInput);
      expect(isValid).toBe(false);
      expect(validate.errors?.some((e) => e.instancePath === '/props/hourFormat')).toBe(true);
    });

    it('should fail on a non-numeric minuteStep', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, minuteStep should be a number
          {
            uid: 'dti-2',
            path: 'meetingAt',
            kind: 'input',
            type: 'dateTimeInput',
            props: {
              minuteStep: '15',
            },
          },
        ],
      });

      const invalidDateTimeInput = formDef.form.children[0];
      const isValid = validate(invalidDateTimeInput);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'type' && e.instancePath === '/props/minuteStep',
        ),
      ).toBe(true);
    });
  });
});
