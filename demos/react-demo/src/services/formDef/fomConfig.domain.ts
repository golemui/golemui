import { ActionDef, ActionDefOrPartialCallback, InputDef } from './formDef.domain';
import { PartialInputDefOrPartialCallback } from './dx/gui/shortcuts/guiFields.impl';

export interface DefaultInputFunctionDefParams {
  data: any;
  fieldKey: string;
  currentDef: InputDef;
  baseDef: InputDef;
}

export type PartialInputDefCallback = (
  params: Partial<DefaultInputFunctionDefParams>,
) => Partial<InputDef>;
export interface ActionHints<T extends Record<string, any> = any> {
  onSubmit?: (data: T) => void;
}

export interface ItemHints {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export interface FormConfigHints<T extends Record<string, any> = any>
  extends ItemHints,
    ActionHints<T> {}

export type FormActionConfigCallback = (current: ActionDef) => ActionDefOrPartialCallback;
export type FormActionConfigLike = Partial<ActionDef> | FormActionConfigCallback;

export type FormInputConfigCallback = (current: InputDef) => PartialInputDefOrPartialCallback;
export type FormInputConfigLike = Partial<InputDef> | FormInputConfigCallback;

export interface FormConfigDefaults extends FormConfigHints {
  defaultActionDef?: FormActionConfigLike;
  defaultInputDef?: FormInputConfigLike;
}

export interface FormConfig<T extends Record<string, any> = any>
  extends FormConfigHints,
    FormConfigDefaults {
  tags?: Record<string, FormConfig<T>>;
}
