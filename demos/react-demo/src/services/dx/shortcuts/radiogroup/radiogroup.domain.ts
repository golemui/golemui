import type { Option, RadiogroupProps } from '@golemui/gui-shared';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface RadiogroupDecorator extends DxInputBase, DxCommonFields, Partial<RadiogroupProps> {
  type: 'radiogroup';
  options: Option[];
}

export interface GslRadiogroupConfig extends GslConfigBase<RadiogroupDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RadiogroupEntry = { key: string; def: DefOrCallback<RadiogroupDecorator> };
export type GuiRadiogroupShortcut = GuiShortcutOf<'RADIOGROUP', RadiogroupEntry>;
