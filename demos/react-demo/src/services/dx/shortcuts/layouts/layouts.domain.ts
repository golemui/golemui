import { DxRuntimeParams } from '../inputs/inputs.domain';
import { RuntimeFunction, GuiItemsShortcut, GUI_ITEM_TYPE_LAYOUTS, ValidGuiShortcut } from '../../core/dx.domain';
import { WidgetItemDecorator } from '../../formDef.domain';

// ═══════════════════════════════════════════════════
// Layout Decorator (DX-level type for layouts)
// ═══════════════════════════════════════════════════

export interface LayoutDecorator extends WidgetItemDecorator {
  direction?: 'vertical' | 'horizontal';
  widgetName?: string;
}

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
  itemType: GUI_ITEM_TYPE_LAYOUTS;
  items: LayoutEntry[];
}
