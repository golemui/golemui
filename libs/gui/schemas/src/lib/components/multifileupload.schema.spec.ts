import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST =
  'https://golemui.com/schemas/gui/components/multifileupload.schema.json';

describe('MultiFileUpload schema validation', () => {
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
    it('should validate a minimum valid multiFileUpload definition', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'files-1',
            path: 'attachments',
            kind: 'input',
            type: 'multiFileUpload',
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
            uid: 'files-1',
            path: 'attachments',
            kind: 'input',
            type: 'multiFileUpload',
            props: {
              hint: 'Images up to 2 MB each',
              icon: 'mdi-upload',
              accept: ['image/*'],
              maxSize: 2 * 1024 * 1024,
              buttonLabel: 'Upload images',
              removeAriaLabel: 'Remove {name}',
              cancelAriaLabel: 'Cancel {name}',
              retryAriaLabel: 'Try again {name}',
              retryIcon: 'mdi-refresh',
              removeIcon: 'mdi-close',
              maxSizeMessage: 'Max 2 MB',
              acceptMessage: 'Images only',
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
            uid: 'files-1',
            path: 'attachments',
            kind: 'input',
            type: 'multiFileUpload',
            props: {
              accept: ['image/*'],
              'accept.isAdmin': ['image/*', 'application/pdf'],
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });

    it('should validate a preloaded defaultValue array', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'files-1',
            path: 'attachments',
            kind: 'input',
            type: 'multiFileUpload',
            defaultValue: [
              {
                id: 'srv-1',
                name: 'a.png',
                size: 1024,
                type: 'image/png',
                status: 'uploaded',
                data: 'https://cdn.example.com/a.png',
              },
            ],
          },
        ],
      });

      const widget = formDef.form.children[0];
      const isValid = validate(widget);
      if (!isValid) specValidationErrorsLogger(validate, widget);
      expect(isValid).toBe(true);
    });
  });

  describe('validator field', () => {
    it('should validate a files validator', () => {
      const formDef = golemForm().create({
        form: [
          {
            path: 'attachments',
            kind: 'input',
            type: 'multiFileUpload',
            validator: {
              type: 'files',
              required: true,
              minItems: 1,
              maxItems: 3,
              blockPendingUploads: true,
              messages: {
                required: 'Add at least one file',
                maxItems: 'No more than 3 files',
                pendingUploads: 'Wait for the uploads',
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
    it('should fail on a non-array defaultValue', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, defaultValue must be an array
          {
            uid: 'files-1',
            path: 'attachments',
            kind: 'input',
            type: 'multiFileUpload',
            defaultValue: {
              id: 'srv-1',
              name: 'a.png',
              size: 1024,
              type: 'image/png',
              status: 'uploaded',
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
            uid: 'files-1',
            path: 'attachments',
            kind: 'input',
            type: 'multiFileUpload',
            props: {
              maxFiles: 3,
            },
          },
        ],
      });

      const widget = formDef.form.children[0];
      expect(validate(widget)).toBe(false);
    });
  });
});
