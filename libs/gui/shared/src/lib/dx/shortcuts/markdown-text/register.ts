// Mirrors the alert shortcut — a bare, props-only display widget with no callback hook.
import { createShortcutType } from '@golemui/dx';
import type {
  GslMarkdownTextsConfig,
  MarkdownTextDecorator,
  MarkdownTextEntry,
} from './markdownText.domain';

export const markdownTextShortcutType = createShortcutType<
  MarkdownTextEntry,
  MarkdownTextDecorator,
  GslMarkdownTextsConfig
>({
  itemType: 'MARKDOWN_TEXTS',
  kind: 'display',
  entryShape: 'bare',
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'display',
    type: 'markdownText',
    props: {
      md: def.md,
    },
  }),
});

export const _gslMarkdownTexts = markdownTextShortcutType.gsl;
export const _gslMarkdownTextByUid = markdownTextShortcutType.gslByUid;
