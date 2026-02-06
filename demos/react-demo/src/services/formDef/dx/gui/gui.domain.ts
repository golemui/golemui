import { ActionDefCallback, ActionDef } from '../../formDef.domain';
import { InputDefOrCallback } from './shortcuts/guiFields.impl';

export enum GuiShortcutType {
  LAYOUT = 'LAYOUT',
  ITEMS = 'ITEMS',
}

export interface GuiShortcut {
  type: GuiShortcutType;
  tags: string[];
}

export enum GuiItemsShortcutType {
  INPUTS = 'INPUTS',
  ACTIONS = 'ACTIONS',
}
export interface ReadyToMapInputDef {
  key: string;
  inputDefOrCallback: InputDefOrCallback;
}

export type ReadyToMapActionDef = ActionDef | ActionDefCallback;
export type ReadyToMapItemDef = ReadyToMapInputDef | ReadyToMapActionDef;

export interface GuiItemsShortcut extends GuiShortcut {
  type: GuiShortcutType.ITEMS;
  itemsType: GuiItemsShortcutType;
  items: ReadyToMapInputDef[] | ReadyToMapActionDef[];
}

export interface GuiFieldsShortcut extends GuiItemsShortcut {
  type: GuiShortcutType.ITEMS;
  itemsType: GuiItemsShortcutType.INPUTS;
  items: ReadyToMapInputDef[];
}

export interface GuiActionsShortcut extends GuiItemsShortcut {
  type: GuiShortcutType.ITEMS;
  itemsType: GuiItemsShortcutType.ACTIONS;
  items: ReadyToMapActionDef[];
}

export interface GuiLayoutShortcut<T> extends GuiShortcut {
  type: GuiShortcutType.LAYOUT;
  layoutRootProps: {
    widgetName: string;
  };
  layoutNestedProps: T;
  children: ValidGuiShortcut[];
}

export type ValidGuiShortcut = GuiFieldsShortcut | GuiLayoutShortcut<any> | GuiActionsShortcut;
