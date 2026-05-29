// Mirrors the alert shortcut — a bare, props-only display widget with no callback hook.
import { defineShortcutType } from '../../core/defineShortcutType';
import type {
  GslMarkdownTextsConfig,
  MarkdownTextDecorator,
  MarkdownTextEntry,
} from './markdownText.domain';

export const { gsl: _gslMarkdownTexts, gslByUid: _gslMarkdownTextByUid } = defineShortcutType<
  MarkdownTextEntry,
  MarkdownTextDecorator,
  GslMarkdownTextsConfig
>({
  itemType: 'MARKDOWN_TEXTS',
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
