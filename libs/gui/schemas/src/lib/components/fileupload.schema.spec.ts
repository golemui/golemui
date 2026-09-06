import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/fileupload.schema.json';

describe('FileUpload schema validation', () => {
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
    it('should validate a minimum valid fileUpload definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate all valid props', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            props: {
              hint: 'PDF up to 5 MB',
              icon: 'mdi-upload',
              accept: ['application/pdf', '.docx'],
              maxSize: 5 * 1024 * 1024,
              buttonLabel: 'Upload CV',
              removeAriaLabel: 'Remove {name}',
              cancelAriaLabel: 'Cancel {name}',
              retryAriaLabel: 'Try again {name}',
              retryIcon: 'mdi-refresh',
              removeIcon: 'mdi-close',
              maxSizeMessage: 'Max 5 MB',
              acceptMessage: 'PDF or Word only',
              interruptedMessage: 'Pick {name} again',
              missingServiceMessage: 'Uploads are not configured',
              uploadedMessage: '{name} uploaded',
              removedMessage: '{name} removed',
              failedMessage: '{name} failed',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate state-scoped properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            props: {
              maxSize: 1024,
              'maxSize.isPremium': 10240,
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate i18n localizable properties', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            label: { key: 'cv.label', default: 'CV' },
            props: {
              buttonLabel: { key: 'cv.button', default: 'Upload CV' },
              maxSizeMessage: { key: 'cv.tooBig', default: 'Too big' },
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate a preloaded defaultValue and null', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            defaultValue: {
              id: 'srv-1',
              name: 'cv.pdf',
              size: 204800,
              type: 'application/pdf',
              status: 'uploaded',
              data: { url: 'https://cdn.example.com/cv.pdf' },
            },
          },
          {
            uid: 'file-2',
            path: 'cover',
            kind: 'input',
            type: 'fileUpload',
            defaultValue: null,
          },
        ],
      });

      for (const widget of formDef.form.children) {
        const isValid = validate(widget);
        if (!isValid) specValidationErrorsLogger(validate, widget);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('validator field', () => {
    it('should validate a file validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            validator: {
              type: 'file',
              required: true,
              blockPendingUploads: true,
              messages: {
                required: 'Please upload your CV',
                pendingUploads: 'Wait for the upload',
              },
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid configurations', () => {
    it('should fail on invalid type for accept', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid type for accept
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            props: {
              accept: 'image/*',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      expect(isValid).toBe(false);
      expect(
        validate.errors?.some((e) => e.keyword === 'type' && e.instancePath === '/props/accept'),
      ).toBe(true);
    });

    it('should fail on a defaultValue with an unknown status', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, invalid status
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            defaultValue: {
              id: 'srv-1',
              name: 'cv.pdf',
              size: 1,
              type: 'application/pdf',
              status: 'done',
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
    });

    it('should fail on unknown prop', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, unknown prop
          {
            uid: 'file-1',
            path: 'cv',
            kind: 'input',
            type: 'fileUpload',
            props: {
              multiple: true,
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
    });
  });
});
