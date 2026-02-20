import { RuntimeFunction, GuiItemsShortcut, GUI_ITEM_TYPE_DISPLAYS } from '../../core/dx.domain';
import { DxRuntimeParams } from '../inputs/inputs.domain';
import { WidgetItemDecorator } from '../../formDef.domain';

// ═══════════════════════════════════════════════════
// Display Decorator
// ═══════════════════════════════════════════════════

export interface DisplayDecorator extends WidgetItemDecorator {
  render: (params: DxRuntimeParams) => any;
}

// ═══════════════════════════════════════════════════
// Display Sensible Defaults Config
// ═══════════════════════════════════════════════════

export type DisplaySensibleDefaultsConfig = Record<string, never>;

// ═══════════════════════════════════════════════════
// GSL Display Types
// ═══════════════════════════════════════════════════

export type GslDisplayDecoratorCallback = (current: DisplayDecorator) => Partial<DisplayDecorator> | RuntimeFunction;

export interface GslDisplaysConfig {
  decorator?: Partial<DisplayDecorator> | GslDisplayDecoratorCallback;
}

// ═══════════════════════════════════════════════════
// GUI Display Types
// ═══════════════════════════════════════════════════

export type DisplayEntry = DisplayDecorator;

export interface GuiDisplayItemsShortcut extends GuiItemsShortcut {
  itemType: GUI_ITEM_TYPE_DISPLAYS;
  items: DisplayEntry[];
}
