import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/components/rangetimepicker.schema.json';

describe('RangeTimePicker schema validation', () => {
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
    it('should validate a minimum valid rangeTimePicker definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'timeRanges',
            kind: 'input',
            type: 'rangeTimePicker',
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
            path: 'timeRanges',
            kind: 'input',
            type: 'rangeTimePicker',
            props: {
              toggleAriaLabel: 'Open picker',
              hourAriaLabel: 'Hour',
              minuteAriaLabel: 'Minute',
              dayPeriodAriaLabel: 'AM/PM',
              hint: 'Select time ranges',
              icon: 'schedule',
              separator: '-',
              removePillAriaLabel: 'Remove time',
              startTimeAriaLabel: 'Start time',
              endTimeAriaLabel: 'End time',
              hourFormat: '24',
              minuteStep: 15,
              minTime: '09:00:00',
              maxTime: '18:00:00',
              minTimeMessage: 'Too early',
              maxTimeMessage: 'Too late',
              rangeOrderMessage: 'End time must be after start time',
              disabledRanges: [{ start: '12:00:00', end: '13:00:00' }],
              allowCustomTime: true,
              height: 240,
              itemHeight: 36,
              disabledRangeMessage: 'That slot is unavailable',
              noAvailableTimesMessage: 'No times available',
              incompleteMessage: 'Incomplete time',
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
            path: 'timeRanges',
            kind: 'input',
            type: 'rangeTimePicker',
            props: {
              'hint.hasError': 'Time ranges required',
              'minTime.isMobile': '10:00:00',
              'maxTime.isMobile': '16:00:00',
              'allowCustomTime.isDesktop': true,
              'noAvailableTimesMessage.hasError': 'None left',
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
            path: 'timeRanges',
            kind: 'input',
            type: 'rangeTimePicker',
            props: {},
            validator: {
              type: 'array',
              required: true,
              minItems: 1,
              messages: {
                required: 'Time range is required',
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
            uid: 'rtp-1',
            path: 'timeRanges',
            kind: 'input',
            type: 'rangeTimePicker',
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

    it('should fail on a disabled range missing its end', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'rtp-2',
            path: 'timeRanges',
            kind: 'input',
            type: 'rangeTimePicker',
            props: {
              // @ts-expect-error a disabled time range requires both ends
              disabledRanges: [{ start: '12:00:00' }],
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
    });
  });
});
