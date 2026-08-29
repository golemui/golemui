import type { FileValidator } from '@golemui/gui-validators';
import type { FileUploadProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface FileUploadDecorator extends DxInputBase, DxCommonFields, Partial<FileUploadProps> {
  type: 'fileUpload';
  validator?: DxValidator<FileValidator>;
}

export interface GslFileUploadConfig extends GslConfigBase<FileUploadDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type FileUploadEntry = { key: string; def: DefOrCallback<FileUploadDecorator> };
export type GuiFileUploadShortcut = GuiShortcutOf<'FILE_UPLOAD', FileUploadEntry>;
