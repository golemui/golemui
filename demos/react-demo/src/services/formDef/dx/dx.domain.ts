import {
  FormDefFacade,
  ProcessedValidControllerDef,
  ProcessedValidInputDef,
} from '../formDef.domain';
import { DxWiringService } from './config/dxWiring.service';

export type HORIZONTAL_LAYOUT_SHORTCUT = '_horizontalLayout';
export type SUBMIT_BUTTON_SHORTCUT = '_submitButton';
export type ValidShortcutNames =
  | HORIZONTAL_LAYOUT_SHORTCUT
  | SUBMIT_BUTTON_SHORTCUT
  | '_inputDefsByKey'; // There is no constant name for this as is a special key, the user does not use a tuple syntax but passes an object with keys
export type DxShortcutType =
  | 'array' //This would be a string, or an array of [key, ...tags]
  | 'empty' //This would be a string, or an array of [key, ...tags]
  | 'object' //The user is giving us some properties for a field or controller
  | 'callback'; //The user is giving a callback that resolves to some properties for a field or controller
type DxShortcutFamily = 'layout' | 'controllers' | 'fields';

export interface DxShortcutDescriptor {
  allows: DxShortcutType[];
  produces: DxShortcutFamily;
  wiring: (dxWiringService: DxWiringService, source: ParsedDxShortcut<any>) => ValidUnrolledElement;
}

export interface LayoutDxShortcutDescriptor extends DxShortcutDescriptor {
  produces: 'layout';
  orientation: 'horizontal' | 'vertical';
}

export interface ParsedDxShortcut<PAYLOAD> {
  descriptor: DxShortcutDescriptor;
  actualType: DxShortcutType;
  shortcut: ValidShortcutNames;
  payload: PAYLOAD;
  tags: [];
}

export interface LayoutDxShortcut<PAYLOAD extends Record<string, any>>
  extends ParsedDxShortcut<FormDefFacade<PAYLOAD>> {
  descriptor: LayoutDxShortcutDescriptor;
}

export interface UnrolledElements {
  type: DxShortcutFamily;
  source: ParsedDxShortcut<any>;
}

export interface BaseUnrolledItem {
  type: 'field' | 'controller';
  value: ProcessedValidInputDef | ProcessedValidControllerDef;
  tags: string[];
}

export interface UnrolledField extends BaseUnrolledItem {
  type: 'field';
  key: string;
  value: ProcessedValidInputDef;
}

export interface UnrolledController extends BaseUnrolledItem {
  type: 'controller';
  value: ProcessedValidControllerDef;
}

export interface UnrolledLayout extends UnrolledElements {
  type: 'layout';
  layoutKey: 'horizontal' | 'vertical';
  children: ValidUnrolledElement[];
}

export interface UnrolledItems extends UnrolledElements {
  type: 'fields' | 'controllers';
  items: UnrolledField[] | UnrolledController[];
}

export interface UnrolledFields extends UnrolledItems {
  type: 'fields';
  items: UnrolledField[];
}

export interface UnrolledControllers extends UnrolledItems {
  type: 'controllers';
  items: UnrolledController[];
}

export type ValidUnrolledElement = UnrolledLayout | UnrolledItems;
export type UnrollingResult<FORM_DATA extends Record<string, any> = any> =
  | ValidUnrolledElement
  | LayoutDxShortcut<FORM_DATA>;
