import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/timepicker.schema.json';

describe('Timepicker schema validation', () => {
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
    it('should validate a minimum valid timepicker definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingTime',
            kind: 'input',
            type: 'timePicker',
            props: {},
          },
        ],
      });

      const validTimePicker = formDef.form.children[0];
      const isValid = validate(validTimePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTimePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate all valid properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingTime',
            kind: 'input',
            type: 'timePicker',
            props: {
              toggleAriaLabel: 'Open picker',
              hourAriaLabel: 'Hour',
              minuteAriaLabel: 'Minute',
              dayPeriodAriaLabel: 'AM/PM',
              hint: 'Pick a time',
              icon: 'schedule',
              hourFormat: '24',
              minuteStep: 30,
              minTime: '09:00:00',
              maxTime: '18:00:00',
              disabledRanges: [{ start: '12:00:00', end: '13:00:00' }],
              allowCustomTime: true,
              height: 200,
              itemHeight: 40,
              minTimeMessage: 'Too early',
              maxTimeMessage: { key: 'tp.max', default: 'Too late' },
              disabledRangeMessage: 'Unavailable slot',
              noAvailableTimesMessage: 'No slots today',
              incompleteMessage: 'Incomplete time',
            },
          },
        ],
      });

      const validTimePicker = formDef.form.children[0];
      const isValid = validate(validTimePicker);
      if (!isValid) {
        specValidationErrorsLogger(validate, validTimePicker);
      }
      expect(isValid).toBe(true);
    });

    it('should validate a required string validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'meetingTime',
            kind: 'input',
            type: 'timePicker',
            props: {},
            validator: {
              type: 'string',
              required: true,
              format: 'time',
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
    it('should fail on a malformed minTime', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'tp-1',
            path: 'meetingTime',
            kind: 'input',
            type: 'timePicker',
            props: {
              minTime: '25:00:00',
            },
          },
        ],
      });

      const invalidTimePicker = formDef.form.children[0];
      const isValid = validate(invalidTimePicker);
      expect(isValid).toBe(false);
      expect(validate.errors?.some((e) => e.instancePath === '/props/minTime')).toBe(true);
    });

    it('should fail on a disabled range missing its end', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, disabled ranges need both start and end
          {
            uid: 'tp-2',
            path: 'meetingTime',
            kind: 'input',
            type: 'timePicker',
            props: {
              disabledRanges: [{ start: '12:00:00' }],
            },
          },
        ],
      });

      const invalidTimePicker = formDef.form.children[0];
      const isValid = validate(invalidTimePicker);
      expect(isValid).toBe(false);
      expect(validate.errors?.some((e) => e.keyword === 'required')).toBe(true);
    });

    it('should fail on a non-boolean allowCustomTime', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, allowCustomTime should be a boolean
          {
            uid: 'tp-3',
            path: 'meetingTime',
            kind: 'input',
            type: 'timePicker',
            props: {
              allowCustomTime: 'yes',
            },
          },
        ],
      });

      const invalidTimePicker = formDef.form.children[0];
      const isValid = validate(invalidTimePicker);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some(
          (e) => e.keyword === 'type' && e.instancePath === '/props/allowCustomTime',
        ),
      ).toBe(true);
    });
  });
});
