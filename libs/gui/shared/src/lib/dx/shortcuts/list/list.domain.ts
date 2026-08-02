import type { Validator } from '@golemui/gui-validators';
import type { ListItem, ListProps, OptionValue } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';

export interface ListDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<ListProps<any>, 'items'>> {
  type: 'list';
  items?: ListItem<any>[] | OptionValue[] | Record<string, unknown>[];
  validator?: Validator;
}

export interface GslListConfig extends GslConfigBase<ListDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type ListEntry = { key: string; def: DefOrCallback<ListDecorator> };
export type GuiListShortcut = GuiShortcutOf<'LIST', ListEntry>;
