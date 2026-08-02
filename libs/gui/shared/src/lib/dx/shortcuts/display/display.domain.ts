import { type DxCommonFields, type DxDisplayBase, type DxInternalFields } from '@golemui/dx';
import { type DxRuntimeParams } from '@golemui/dx';
import { type DefOrCallback, type GslConfigBase, type GuiShortcutOf } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// Display Decorator
// ═══════════════════════════════════════════════════

export interface DisplayDecorator extends DxDisplayBase, DxCommonFields {
  render: (params: DxRuntimeParams) => any;
}

/**
 * Full decorator type including pipeline-internal fields.
 */
export type DisplayDecoratorFull = DisplayDecorator & DxInternalFields;

// ═══════════════════════════════════════════════════
// Display Sensible Defaults Config
// ═══════════════════════════════════════════════════

export type DisplaySensibleDefaultsConfig = Record<string, never>;

// ═══════════════════════════════════════════════════
// GSL Display Types
// ═══════════════════════════════════════════════════

export type GslDisplaysConfig = GslConfigBase<DisplayDecorator>;

// ═══════════════════════════════════════════════════
// GUI Display Types
// ═══════════════════════════════════════════════════

export type DisplayEntry = DefOrCallback<DisplayDecorator>;

export type GuiDisplayItemsShortcut = GuiShortcutOf<'DISPLAYS', DisplayEntry>;
