import { ActionDef, ActionDefCallback, InputDef } from './formDef.domain';

export interface DefaultFieldDefParams {
  data: any;
  fieldKey: string;
  currentDef: InputDef;
  baseDef: InputDef;
}

export type DefaultFieldDefFn = (params: Partial<DefaultFieldDefParams>) => Partial<InputDef>;
export type DefaultFieldDefLike = Partial<InputDef> | DefaultFieldDefFn;
export type DefaultButtonDefLike = Partial<ActionDef> | ActionDefCallback;

export interface FormConfig<T extends Record<string, any> = any> {
  defaultButtonDef?: DefaultButtonDefLike;
  defaultFieldDef?: DefaultFieldDefLike;
  suppressAutomaticLabels?: boolean;
  tags?: Record<string, FormConfig<T>>;
  onSubmit?: (data: T) => void;
}
