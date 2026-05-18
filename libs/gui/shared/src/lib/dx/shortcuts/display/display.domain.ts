import {
  type DxCommonFields,
  type DxDisplayBase,
  type DxInternalFields,
} from '../../core/dxBase.types';
import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import {
  type DefOrCallback,
  type GslConfigBase,
  type GuiShortcutOf,
} from '../../core/dxUtilityTypes';

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
