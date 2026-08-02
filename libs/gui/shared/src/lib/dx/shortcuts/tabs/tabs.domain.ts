import type { DxCommonFields, DxLayoutBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { ValidGuiShortcut } from '@golemui/dx';

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
