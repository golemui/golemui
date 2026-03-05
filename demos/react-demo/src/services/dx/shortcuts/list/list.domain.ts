import type { ListItem, ListProps } from '@golemui/gui-shared';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface ListDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<ListProps<any>, 'items'>> {
  type: 'list';
  items: ListItem<any>[];
}

export interface GslListConfig extends GslConfigBase<ListDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type ListEntry = { key: string; def: DefOrCallback<ListDecorator> };
export type GuiListShortcut = GuiShortcutOf<'LIST', ListEntry>;
