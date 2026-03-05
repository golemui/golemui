import { FlexProps } from '@golemui/gui-shared';
import { DxRuntimeParams } from '../inputs/inputs.domain';
import { RuntimeFunction, GuiItemsShortcut, ValidGuiShortcut } from '../../core/dx.domain';
import { DxCommonFields, DxInternalFields, DxLayoutBase } from '../../core/dxBase.types';

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

export type GslLayoutDecoratorCallback = (current: LayoutDecorator) => Partial<LayoutDecorator> | RuntimeFunction;

export interface GslLayoutsConfig {
  decorator?: Partial<LayoutDecorator> | GslLayoutDecoratorCallback;
}

// ═══════════════════════════════════════════════════
// GUI Layout Types
// ═══════════════════════════════════════════════════

export type LayoutDefCallback = (params: DxRuntimeParams) => Partial<LayoutDecorator>;
export type LayoutDefOrCallback = LayoutDecorator | LayoutDefCallback;

export type LayoutEntry = { def: LayoutDefOrCallback; children: ValidGuiShortcut[] };

export interface GuiLayoutItemsShortcut extends GuiItemsShortcut {
  itemType: 'LAYOUTS';
  items: LayoutEntry[];
}
