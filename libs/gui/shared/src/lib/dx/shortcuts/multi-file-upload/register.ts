import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslMultiFileUploadConfig,
  MultiFileUploadDecorator,
  MultiFileUploadEntry,
} from './multi-file-upload.domain';

export const multiFileUploadShortcutType = createShortcutType<
  MultiFileUploadEntry,
  MultiFileUploadDecorator,
  GslMultiFileUploadConfig
>({
  itemType: 'MULTI_FILE_UPLOAD',
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
    type: 'multiFileUpload',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'files') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslMultiFileUploads = multiFileUploadShortcutType.gsl;
export const _gslMultiFileUploadByUid = multiFileUploadShortcutType.gslByUid;
