import { ActionDecorator, ActionDefOrPartialCallback, InputDecorator } from './formDef.domain';
import { PartialInputDecoratorOrCallback } from './shortcuts/gui/shortcuts/guiFields.impl';

export interface DefaultInputFunctionDefParams {
  data: any;
  fieldKey: string;
  currentDef: InputDecorator;
  baseDef: InputDecorator;
}

export type PartialInputDefCallback = (
  params: Partial<DefaultInputFunctionDefParams>,
) => Partial<InputDecorator>;
export interface ActionHints<T extends Record<string, any> = any> {
  onSubmit?: (data: T) => void;
}

export interface ActionsSensibleDefaults {

}
export interface InputSensibleDefaults {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}
export type ActionDecoratorCallback = (current: ActionDecorator) => ActionDefOrPartialCallback;
export type ActionWidgetDecoratorsLike = Partial<ActionDecorator> | ActionDecoratorCallback;

export type InputDecoratorCallback = (current: InputDecorator) => PartialInputDecoratorOrCallback;
export type InputWidgetDecoratorsLike = Partial<InputDecorator> | InputDecoratorCallback;

export interface FormSensibleDefaults {
  inputs?: InputSensibleDefaults;
  actions?: ActionsSensibleDefaults;
}

export interface FormDecorators {
  inputs?: InputWidgetDecoratorsLike;
  actions?: ActionWidgetDecoratorsLike;
}
export interface DxSelectors<T extends Record<string, any> = any> {
  tags?: Record<string, DxSelectors<T>>;
  decorators?: FormDecorators;
  sensibleDefaults?: FormSensibleDefaults;
}
