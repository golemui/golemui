import { type FlexProps, type GridProps } from '../../../widget.props';
import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import { type ValidGuiShortcut } from '../../core/dx.domain';
import { type DxCommonFields, type DxInternalFields, type DxLayoutBase } from '../../core/dxBase.types';
import { type DefOrCallback, type GslConfigBase, type GuiShortcutOf } from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Layout Decorator (DX-level type for layouts)
// ═══════════════════════════════════════════════════
//
// Pipeline-internal decorator. The `widgetName` discriminator selects the
// underlying layout shape; per-family props are typed at the façade
// (`FlexFamilyProps` / `GridFamilyProps`) and flow through this decorator
// at runtime via the spread in `_guiFlex` / `_guiGrid`.

export interface LayoutDecorator extends DxLayoutBase, DxCommonFields {
  widgetName?: string;
  direction?: FlexProps['direction'] | GridProps['direction'];
  justify?: FlexProps['justify'];
  align?: FlexProps['align'] | GridProps['align'];
  gap?: FlexProps['gap'];
  columnGap?: GridProps['columnGap'];
  rowGap?: GridProps['rowGap'];
  autoFit?: GridProps['autoFit'];
}

// ═══════════════════════════════════════════════════
// Per-family façade prop types (spec-strict)
// ═══════════════════════════════════════════════════

/** User-facing prop slot for the flex family (`gui.layouts.flex` and variants). */
export type FlexFamilyProps = FlexProps & DxLayoutBase & DxCommonFields;

/** User-facing prop slot for the grid family (`gui.layouts.grid` and variants). */
export type GridFamilyProps = GridProps & DxLayoutBase & DxCommonFields;

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
