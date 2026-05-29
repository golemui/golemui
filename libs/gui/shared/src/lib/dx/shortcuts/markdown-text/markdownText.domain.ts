import type { MarkdownTextProps } from '../../../widget.props';
import type { DxCommonFields } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Markdown Text Decorator
// ═══════════════════════════════════════════════════

export interface MarkdownTextDecorator extends DxCommonFields, Partial<MarkdownTextProps> {
  md: string; // required — MarkdownTextProps.md is required
}

// ═══════════════════════════════════════════════════
// GSL Markdown Text Types
// ═══════════════════════════════════════════════════

export type GslMarkdownTextsConfig = GslConfigBase<MarkdownTextDecorator>;

// ═══════════════════════════════════════════════════
// GUI Markdown Text Types
// ═══════════════════════════════════════════════════

export type MarkdownTextEntry = DefOrCallback<MarkdownTextDecorator>;

export type GuiMarkdownTextShortcut = GuiShortcutOf<'MARKDOWN_TEXTS', MarkdownTextEntry>;
