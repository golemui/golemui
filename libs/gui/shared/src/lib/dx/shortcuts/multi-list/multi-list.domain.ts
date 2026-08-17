import type { Validator } from '@golemui/gui-validators';
import type { ListItem, MultiListProps, OptionValue } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

export interface MultiListDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<MultiListProps<any>, 'items'>> {
  type: 'multiList';
  items?: ListItem<any>[] | OptionValue[] | Record<string, unknown>[];
  validator?: Validator;
}

export interface GslMultiListConfig extends GslConfigBase<MultiListDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type MultiListEntry = { key: string; def: DefOrCallback<MultiListDecorator> };
export type GuiMultiListShortcut = GuiShortcutOf<'MULTI_LIST', MultiListEntry>;
