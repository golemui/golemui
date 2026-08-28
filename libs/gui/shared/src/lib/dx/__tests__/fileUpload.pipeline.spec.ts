import { describe, expect, it } from 'vitest';
import {
  _guiFileUpload,
  _gslFileUploads,
  _gslFileUploadByUid,
  _guiMultiFileUpload,
  _gslMultiFileUploads,
  _gslMultiFileUploadByUid,
} from '../index';
import { processDx, getStaticChild } from './helpers';

type WidgetShape = {
  kind?: string;
  type?: string;
  path?: string;
  label?: string;
  validator?: Record<string, unknown>;
  props?: Record<string, unknown>;
};

describe('DX Pipeline — FileUpload', () => {
  it('expands _guiFileUpload into a fileUpload input', () => {
    const result = processDx(
      _guiFileUpload('cv', {
        accept: ['application/pdf'],
        maxSize: 1024,
        buttonLabel: 'Upload CV',
      }),
    );
    const w = getStaticChild(result, 0) as WidgetShape;

    expect(w.kind).toBe('input');
    expect(w.type).toBe('fileUpload');
    expect(w.path).toBe('cv');
    expect(w.props?.['accept']).toEqual(['application/pdf']);
    expect(w.props?.['maxSize']).toBe(1024);
    expect(w.props?.['buttonLabel']).toBe('Upload CV');
  });

  it('supports the zero-props form and auto-generates the label from the path', () => {
    const result = processDx(_guiFileUpload('coverLetter'));
    const w = getStaticChild(result, 0) as WidgetShape;

    expect(w.type).toBe('fileUpload');
    expect(w.label).toBe('Cover Letter');
    expect(w.props?.['placeholder']).toBeUndefined();
  });

  it('tags an untyped validator as a file validator', () => {
    const result = processDx(_guiFileUpload('cv', { validator: { required: true } }));
    const w = getStaticChild(result, 0) as WidgetShape;

    expect(w.validator).toEqual({ type: 'file', required: true });
  });

  it('passes a custom validator through untouched', () => {
    const result = processDx(
      _guiFileUpload('cv', { validator: { type: 'custom', virusScan: { strict: true } } }),
    );
    const w = getStaticChild(result, 0) as WidgetShape;

    expect(w.validator).toEqual({ type: 'custom', virusScan: { strict: true } });
  });

  it('applies broad and by-uid GSL overrides', () => {
    const result = processDx(
      [_guiFileUpload('cv', { uid: 'cv-upload' }), _guiFileUpload('cover')],
      [
        _gslFileUploads({ override: { maxSize: 2048 } }),
        _gslFileUploadByUid('cv-upload', { override: { buttonLabel: 'Pick CV' } }),
      ],
    );
    const cv = getStaticChild(result, 0) as WidgetShape;
    const cover = getStaticChild(result, 1) as WidgetShape;

    expect(cv.props?.['maxSize']).toBe(2048);
    expect(cv.props?.['buttonLabel']).toBe('Pick CV');
    expect(cover.props?.['maxSize']).toBe(2048);
    expect(cover.props?.['buttonLabel']).toBeUndefined();
  });
});

describe('DX Pipeline — MultiFileUpload', () => {
  it('expands _guiMultiFileUpload into a multiFileUpload input', () => {
    const result = processDx(
      _guiMultiFileUpload('attachments', { accept: ['image/*'], removeAriaLabel: 'Drop {name}' }),
    );
    const w = getStaticChild(result, 0) as WidgetShape;

    expect(w.kind).toBe('input');
    expect(w.type).toBe('multiFileUpload');
    expect(w.path).toBe('attachments');
    expect(w.label).toBe('Attachments');
    expect(w.props?.['accept']).toEqual(['image/*']);
    expect(w.props?.['removeAriaLabel']).toBe('Drop {name}');
  });

  it('tags an untyped validator as a files validator', () => {
    const result = processDx(
      _guiMultiFileUpload('attachments', { validator: { required: true, maxItems: 3 } }),
    );
    const w = getStaticChild(result, 0) as WidgetShape;

    expect(w.validator).toEqual({ type: 'files', required: true, maxItems: 3 });
  });

  it('applies broad and by-uid GSL overrides', () => {
    const result = processDx(_guiMultiFileUpload('attachments', { uid: 'att' }), [
      _gslMultiFileUploads({ override: { maxSize: 4096 } }),
      _gslMultiFileUploadByUid('att', { override: { buttonLabel: 'Add files' } }),
    ]);
    const w = getStaticChild(result, 0) as WidgetShape;

    expect(w.props?.['maxSize']).toBe(4096);
    expect(w.props?.['buttonLabel']).toBe('Add files');
  });
});
