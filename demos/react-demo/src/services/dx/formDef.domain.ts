import * as Core from '@golemui/core';
import { ValidGuiShortcut } from './core/dx.domain';
import { DxRuntimeParams } from './shortcuts/inputs/inputs.domain';

// ═══════════════════════════════════════════════════
// Base Types (owned here)
// ═══════════════════════════════════════════════════

export type GslItemType = 'INPUTS' | 'ACTIONS' | 'LAYOUTS' | 'DISPLAYS';

export interface WidgetItemDecorator {
  itemType?: GslItemType;
  tags?: string[];
  uid?: string;
  removeField?: boolean;
}

// ═══════════════════════════════════════════════════
// DX-level aggregate types
// ═══════════════════════════════════════════════════

export type DxDisplayRenderFn = (params: DxRuntimeParams) => any;
export type DxDefinitionItem = ValidGuiShortcut | DxDisplayRenderFn;
export type DxDefinitions = DxDefinitionItem | DxDefinitionItem[];

export type FormEvents = (event: Core.FormEvent) => void;

// ═══════════════════════════════════════════════════
// Re-exports from shortcut folders (backward compat)
// ═══════════════════════════════════════════════════

export type {
  DataInputDecorator,
  NumberDataInputValidator,
  NumberDataInputDecorator,
  TextDataInputValidator,
  TextDataInputDecorator,
  BooleanDataInputDecorator,
  InputDecorator,
  ValidShortcutType,
  DxRuntimeParams,
  InputTags,
  PartialInputDefCallback,
} from './shortcuts/inputs/inputs.domain';

export type {
  ActionDecorator,
  ActionDefCallback,
  ActionDefOrCallback,
} from './shortcuts/actions/actions.domain';
