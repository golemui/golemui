import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiMultiFileUploadShortcut,
  MultiFileUploadDecorator,
  MultiFileUploadEntry,
} from './multi-file-upload.domain';

export function _guiMultiFileUpload(path: string): GuiMultiFileUploadShortcut;
export function _guiMultiFileUpload(
  path: string,
  props: Partial<Omit<MultiFileUploadDecorator, 'type'>>,
): GuiMultiFileUploadShortcut;
export function _guiMultiFileUpload(
  path: string,
  props: Partial<Omit<MultiFileUploadDecorator, 'type'>>,
  tags: string[],
): GuiMultiFileUploadShortcut;
export function _guiMultiFileUpload(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<MultiFileUploadDecorator, 'type'>>,
  tags?: string[],
): GuiMultiFileUploadShortcut;
export function _guiMultiFileUpload(
  path: string,
  propsOrCallback?:
    | Partial<Omit<MultiFileUploadDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<MultiFileUploadDecorator, 'type'>>),
  tags?: string[],
): GuiMultiFileUploadShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'multiFileUpload' as const,
      ...callback(params),
    });
    const items: MultiFileUploadEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'MULTI_FILE_UPLOAD', items, tags: tags ?? [] };
  }

  const def: MultiFileUploadDecorator = { type: 'multiFileUpload', ...propsOrCallback };
  const items: MultiFileUploadEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'MULTI_FILE_UPLOAD', items, tags: tags ?? [] };
}
