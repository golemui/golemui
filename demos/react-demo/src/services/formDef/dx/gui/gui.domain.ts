import { ReadyToMapField } from './fields/guiFields.impl';
import { ActionDef, ControllerDefCallback } from '../../formDef.domain';

export enum GuiShortcutType {
  FIELDS = 'FIELDS',
  CONTROLLERS = 'CONTROLLERS',
  LAYOUT = 'LAYOUT',
}

export interface GuiShortcut {
  type: GuiShortcutType;
  tags: string[];
}

export interface GuiFieldsShortcut extends GuiShortcut {
  type: GuiShortcutType.FIELDS;
  fields: ReadyToMapField[];
}

export interface GuiControllersShortcut extends GuiShortcut {
  type: GuiShortcutType.CONTROLLERS;
  controllers: (ActionDef | ControllerDefCallback)[];
}

export interface GuiLayoutShortcut<T> extends GuiShortcut {
  type: GuiShortcutType.LAYOUT;
  layoutRootProps: {
    widgetName: string;
  };
  layoutNestedProps: T;
  children: ValidGuiShortcut[];
}

export type ValidGuiShortcut = GuiFieldsShortcut | GuiLayoutShortcut<any> | GuiControllersShortcut;
