import { FlexProps } from '@golemui/gui-shared';
import { DxRuntimeParams } from '../inputs/inputs.domain';
import { ValidGuiShortcut } from '../../core/dx.domain';
import { DxCommonFields, DxInternalFields, DxLayoutBase } from '../../core/dxBase.types';
import {
  DefOrCallback,
  GslConfigBase,
  GuiShortcutOf,
} from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Layout Decorator (DX-level type for layouts)
// ═══════════════════════════════════════════════════

export interface LayoutDecorator extends DxLayoutBase, DxCommonFields {
  direction?: 'vertical' | 'horizontal';
  widgetName?: string;
  props?: Partial<FlexProps>;
}

/**
 * Full decorator type including pipeline-internal fields.
 */
export type LayoutDecoratorFull = LayoutDecorator & DxInternalFields;

// ═══════════════════════════════════════════════════
// Layout Sensible Defaults Config
// ═══════════════════════════════════════════════════

export type LayoutSensibleDefaultsConfig = Record<string, never>;

// ═══════════════════════════════════════════════════
// GSL Layout Types
// ═══════════════════════════════════════════════════

export type GslLayoutsConfig = GslConfigBase<LayoutDecorator>;

// ═══════════════════════════════════════════════════
// GUI Layout Types
// ═══════════════════════════════════════════════════

export type LayoutDefCallback = (params: DxRuntimeParams) => Partial<LayoutDecorator>;
export type LayoutDefOrCallback = DefOrCallback<LayoutDecorator>;

export type LayoutEntry = { def: LayoutDefOrCallback; children: ValidGuiShortcut[] };

export type GuiLayoutItemsShortcut = GuiShortcutOf<'LAYOUTS', LayoutEntry>;
