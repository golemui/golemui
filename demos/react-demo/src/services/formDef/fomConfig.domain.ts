import { ActionDef, ControllerDefCallback, OneOfDataInputDefs } from './formDef.domain';

export interface DefaultFieldDefParams {
  data: any;
  fieldKey: string;
  currentDef: OneOfDataInputDefs;
  baseDef: OneOfDataInputDefs;
}

export type DefaultFieldDefFn = (params: Partial<DefaultFieldDefParams>) => Partial<OneOfDataInputDefs>;
export type DefaultFieldDefLike = Partial<OneOfDataInputDefs> | DefaultFieldDefFn;
export type DefaultButtonDefLike = Partial<ActionDef> | ControllerDefCallback;

export interface FormConfig<T extends Record<string, any> = any> {
  defaultButtonDef?: DefaultButtonDefLike;
  defaultFieldDef?: DefaultFieldDefLike;
  suppressAutomaticLabels?: boolean;
  tags?: Record<string, FormConfig<T>>;
  onSubmit?: (data: T) => void;
}
