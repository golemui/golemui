import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { GetSchema, registerGolemSchemas, specValidationErrorsLogger } from '../schema.spec.utils';
import { golemForm } from '../../golem-form';

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
              hint: 'Pick a date',
              placeholder: 'yyyy-mm-dd',
              icon: 'calendar',
              dayFormat: '2-digit',
              monthFormat: 'long',
              weekdayFormat: 'short',
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
              'placeholder.isEmpty': 'Please pick',
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
              placeholder: { key: 'dp.ph', default: 'Placeholder' },
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
  });
});
