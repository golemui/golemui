import { OneOfDataInputDefs } from './formDef.domain';

export interface DefaultFieldDefParams {
  fieldKey: string;
  currentDef: OneOfDataInputDefs;
  baseDef: OneOfDataInputDefs;
}

export type DefaultFieldDefFn = (params: DefaultFieldDefParams) => Partial<OneOfDataInputDefs>;
export type DefaultFieldDefLike = Partial<OneOfDataInputDefs> | DefaultFieldDefFn;

export interface FormConfig<T extends Record<string, any> = any> {
  defaultFieldDef?: DefaultFieldDefLike;
  suppressAutomaticLabels?: boolean;
  tags?: Record<string, FormConfig<T>>
}
