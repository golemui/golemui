import { gui } from '@golemui/gui-shared';

export const fileUploadTab = gui.layouts.flex([
  gui.layouts.grid(
    [
      gui.inputs.textInput('fileUploads.title', {
        label: 'Title',
        placeholder: 'A text input sharing the row with the upload',
      }),
      gui.inputs.fileUpload('fileUploads.basic', {
        label: 'Single file',
        hint: 'Names containing "fail" fail to upload, so you can try the retry button',
      }),
    ],
    { direction: 'row' },
  ),
  gui.inputs.fileUpload('fileUploads.pdfOnly', {
    label: 'PDF or Word, 5 MB max',
    hint: 'Other types and bigger files are refused before uploading',
    icon: 'attach_file',
    accept: ['application/pdf', '.doc', '.docx'],
    maxSize: 5 * 1024 * 1024,
    buttonLabel: 'Upload document',
    validator: { required: true },
  }),
  gui.inputs.fileUpload('fileUploads.preloaded', {
    label: 'Preloaded file',
    hint: 'Restored from the server: only the envelope is in the form data',
  }),
  gui.inputs.multiFileUpload('fileUploads.images', {
    label: 'Images, up to 3',
    hint: 'Files upload one at a time; a fourth file is flagged by the validator, not blocked',
    accept: ['image/*'],
    buttonLabel: 'Upload images',
    validator: { required: true, maxItems: 3 },
  }),
  gui.inputs.multiFileUpload('fileUploads.multiPreloaded', {
    label: 'Preloaded files',
  }),
  gui.inputs.fileUpload('fileUploads.disabled', {
    label: 'Disabled upload',
    disabled: true,
  }),
  gui.inputs.multiFileUpload('fileUploads.readonly', {
    label: 'Readonly files',
    readonly: true,
  }),
]);
