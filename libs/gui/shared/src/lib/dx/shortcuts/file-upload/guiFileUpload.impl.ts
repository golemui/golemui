import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiFileUploadShortcut,
  FileUploadDecorator,
  FileUploadEntry,
} from './file-upload.domain';

export function _guiFileUpload(path: string): GuiFileUploadShortcut;
export function _guiFileUpload(
  path: string,
  props: Partial<Omit<FileUploadDecorator, 'type'>>,
): GuiFileUploadShortcut;
export function _guiFileUpload(
  path: string,
  props: Partial<Omit<FileUploadDecorator, 'type'>>,
  tags: string[],
): GuiFileUploadShortcut;
export function _guiFileUpload(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<FileUploadDecorator, 'type'>>,
  tags?: string[],
): GuiFileUploadShortcut;
export function _guiFileUpload(
  path: string,
  propsOrCallback?:
    | Partial<Omit<FileUploadDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<FileUploadDecorator, 'type'>>),
  tags?: string[],
): GuiFileUploadShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'fileUpload' as const,
      ...callback(params),
    });
    const items: FileUploadEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'FILE_UPLOAD', items, tags: tags ?? [] };
  }

  const def: FileUploadDecorator = { type: 'fileUpload', ...propsOrCallback };
  const items: FileUploadEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'FILE_UPLOAD', items, tags: tags ?? [] };
}
