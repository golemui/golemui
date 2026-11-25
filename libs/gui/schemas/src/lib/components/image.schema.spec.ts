import { describe, it, expect, beforeEach } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';
import { golemForm } from '@golemui/gui-shared/internals';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/image.schema.json';

describe('Image schema validation', () => {
  let validate: GetSchema;

  beforeEach(() => {
    const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
  });

  const expectValid = (widget: unknown) => {
    const isValid = validate(widget);
    if (!isValid) specValidationErrorsLogger(validate, widget);
    expect(isValid).toBe(true);
  };

  const expectError = (widget: unknown, error: Record<string, unknown>) => {
    expect(validate(widget)).toBe(false);
    expect(validate.errors).toEqual(expect.arrayContaining([expect.objectContaining(error)]));
  };

  describe('Valid configurations', () => {
    it('validates a minimal image, and a decorative one with an empty alt', () => {
      for (const alt of ['Double room with a sea view', '']) {
        const formDef = golemForm().create({
          form: [
            { kind: 'display', type: 'image', props: { src: 'https://example.com/room.jpg', alt } },
          ],
        });
        expectValid(formDef.form.children[0]);
      }
    });

    it('validates an image with every prop, a state override and translation keys', () => {
      const formDef = golemForm().create({
        states: { suite: "$form.room === 'suite'" },
        form: [
          {
            uid: 'room',
            kind: 'display',
            type: 'image',
            props: {
              src: 'https://example.com/{{ $form.room }}.jpg',
              alt: { key: 'room.alt', default: 'The room' },
              ratio: '16/9',
              fit: 'contain',
              caption: { key: 'room.caption', default: 'Room 204' },
              loading: 'eager',
              'ratio.suite': '21/9',
            },
          },
        ],
      });
      expectValid(formDef.form.children[0]);
    });
  });

  describe('Invalid configurations', () => {
    it('rejects an image without an alt', () => {
      const formDef = golemForm().create({
        form: [
          // @ts-expect-error Expected, "props.alt" is missing.
          { kind: 'display', type: 'image', props: { src: 'https://example.com/room.jpg' } },
        ],
      });
      expectError(formDef.form.children[0], {
        keyword: 'required',
        params: { missingProperty: 'alt' },
      });
    });

    it('rejects an empty src', () => {
      const formDef = golemForm().create({
        form: [{ kind: 'display', type: 'image', props: { src: '', alt: 'A room' } }],
      });
      expectError(formDef.form.children[0], { keyword: 'minLength', instancePath: '/props/src' });
    });

    it('rejects a free ratio and an unknown fit', () => {
      const formDef = golemForm().create({
        form: [
          {
            kind: 'display',
            type: 'image',
            props: {
              src: 'https://example.com/room.jpg',
              alt: 'A room',
              // @ts-expect-error Expected, ratio is one of the listed proportions.
              ratio: '5/4',
              // @ts-expect-error Expected, fit is one of the object-fit keywords listed.
              fit: 'scale-down',
            },
          },
        ],
      });
      expectError(formDef.form.children[0], { keyword: 'enum', instancePath: '/props/ratio' });
      expectError(formDef.form.children[0], { keyword: 'enum', instancePath: '/props/fit' });
    });
  });
});
