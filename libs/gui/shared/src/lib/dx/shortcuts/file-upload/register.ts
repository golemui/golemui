import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslFileUploadConfig,
  FileUploadDecorator,
  FileUploadEntry,
} from './file-upload.domain';

export const fileUploadShortcutType = createShortcutType<
  FileUploadEntry,
  FileUploadDecorator,
  GslFileUploadConfig
>({
  itemType: 'FILE_UPLOAD',
  kind: 'input',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: { suppressAutomaticLabels: false },
    fields: ['suppressAutomaticLabels'],
    apply: (def, config) => processAutoLabel(def, config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'input',
    type: 'fileUpload',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'file') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslFileUploads = fileUploadShortcutType.gsl;
export const _gslFileUploadByUid = fileUploadShortcutType.gslByUid;
