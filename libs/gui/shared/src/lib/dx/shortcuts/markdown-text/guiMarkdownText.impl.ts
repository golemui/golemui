import type { DxRuntimeParams } from '@golemui/dx';
import type {
  GuiMarkdownTextShortcut,
  MarkdownTextDecorator,
  MarkdownTextEntry,
} from './markdownText.domain';

type MarkdownTextFactoryProps = MarkdownTextDecorator;

export function _guiMarkdownText(
  props: MarkdownTextFactoryProps,
  tags?: string[],
): GuiMarkdownTextShortcut;
export function _guiMarkdownText(
  callback: (params: DxRuntimeParams) => MarkdownTextFactoryProps,
  tags?: string[],
): GuiMarkdownTextShortcut;
export function _guiMarkdownText(
  propsOrCallback:
    | MarkdownTextFactoryProps
    | ((params: DxRuntimeParams) => MarkdownTextFactoryProps),
  tags?: string[],
): GuiMarkdownTextShortcut {
  const items: MarkdownTextEntry[] = [propsOrCallback];
  return { type: 'ITEMS', itemType: 'MARKDOWN_TEXTS', items, tags: tags ?? [] };
}
