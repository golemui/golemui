import { RuntimeFunction, GuiItemsShortcut } from '../../core/dx.domain';
import { DxCommonFields, DxDisplayBase, DxInternalFields } from '../../core/dxBase.types';
import { DxRuntimeParams } from '../inputs/inputs.domain';

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

export type GslDisplayDecoratorCallback = (current: DisplayDecorator) => Partial<DisplayDecorator> | RuntimeFunction;

export interface GslDisplaysConfig {
  decorator?: Partial<DisplayDecorator> | GslDisplayDecoratorCallback;
}

// ═══════════════════════════════════════════════════
// GUI Display Types
// ═══════════════════════════════════════════════════

export type DisplayEntry = DisplayDecorator;

export interface GuiDisplayItemsShortcut extends GuiItemsShortcut {
  itemType: 'DISPLAYS';
  items: DisplayEntry[];
}
