import type { DxCommonFields, DxLayoutBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { ValidGuiShortcut } from '../../core/dx.domain';

export interface TabsDecorator extends DxLayoutBase, DxCommonFields {
  tabs: { label: string; uid: string }[];
  renderMode?: 'all' | 'activeOnly';
  defaultOpen?: string;
}

export type GslTabsConfig = GslConfigBase<TabsDecorator>;

export type TabsEntry = {
  def: DefOrCallback<TabsDecorator>;
  children: ValidGuiShortcut[];
};

export type GuiTabsShortcut = GuiShortcutOf<'TABS', TabsEntry>;
