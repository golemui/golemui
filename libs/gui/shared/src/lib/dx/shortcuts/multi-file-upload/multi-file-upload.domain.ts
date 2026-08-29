import type { FilesValidator } from '@golemui/gui-validators';
import type { MultiFileUploadProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface MultiFileUploadDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<MultiFileUploadProps> {
  type: 'multiFileUpload';
  validator?: DxValidator<FilesValidator>;
}

export interface GslMultiFileUploadConfig extends GslConfigBase<MultiFileUploadDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type MultiFileUploadEntry = { key: string; def: DefOrCallback<MultiFileUploadDecorator> };
export type GuiMultiFileUploadShortcut = GuiShortcutOf<'MULTI_FILE_UPLOAD', MultiFileUploadEntry>;
