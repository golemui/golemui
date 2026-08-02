import type { Validator } from '@golemui/gui-validators';
import type { Option, OptionValue, RadiogroupProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

export interface RadiogroupDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<RadiogroupProps, 'options'>> {
  type: 'radiogroup';
  options?: Option[] | OptionValue[] | Record<string, unknown>[];
  validator?: Validator;
}

export interface GslRadiogroupConfig extends GslConfigBase<RadiogroupDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RadiogroupEntry = { key: string; def: DefOrCallback<RadiogroupDecorator> };
export type GuiRadiogroupShortcut = GuiShortcutOf<'RADIOGROUP', RadiogroupEntry>;
