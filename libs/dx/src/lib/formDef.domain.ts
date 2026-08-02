import type { ExpressionFunctions, Form, FormEvent, UiState } from '@golemui/core';
import { type ValidateOn } from '@golemui/core';
import { type ValidGuiShortcut } from './core/dx.domain';
import { type DxCommonFields, type DxInternalFields } from './core/dxBase.types';
import { type DxRuntimeParams } from './core/dxUtilityTypes';
import { type Dependencies } from './shared';

// ═══════════════════════════════════════════════════
// Base Types (owned here)
// ═══════════════════════════════════════════════════

export type GslItemType = string;

/**
 * @deprecated Use DxCommonFields (+ kind-specific DxInputBase/DxActionBase/etc.)
 * for public decorator interfaces. Use DxInternalFields & DxCommonFields for
 * pipeline-internal code that needs the full set.
 *
 * This type is kept as an alias for backward compatibility with pipeline internals.
 */
export type WidgetItemDecorator = DxInternalFields & DxCommonFields;

// ═══════════════════════════════════════════════════
// DX-level aggregate types
// ═══════════════════════════════════════════════════

export type DxDisplayRenderFn = (params: DxRuntimeParams) => any;
export type DxDefinitionItem = ValidGuiShortcut | DxDisplayRenderFn;
export type DxDefinitions = DxDefinitionItem | DxDefinitionItem[];

export type FormEvents = (event: FormEvent) => void;

export interface DxResult<S extends UiState = never, F extends Record<string, any> = any> {
  form: Form<S, F>;
  events?: FormEvents;
  dependencies?: Dependencies;
  functions?: ExpressionFunctions;
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  validateOn?: ValidateOn;
  itemRenderers?: Record<string, unknown>;
}
