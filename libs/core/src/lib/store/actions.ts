import { FormField } from '../Field';
import { DotPath, Uid } from '../shared';
import { FormStoreError } from './model';

export type INITIALIZE = {
  type: 'INITIALIZE';
  payload: { formDef: string | Record<string, any>; formName: string };
};

export type SET_DATA = {
  type: 'SET_DATA';
  payload: { data: Record<string, any> };
};

export type ADD_FIELD = {
  type: 'ADD_FIELD';
  payload: { field: FormField };
};

export type REMOVE_FIELD = {
  type: 'REMOVE_FIELD';
  payload: { uid: Uid };
};

export type SET_FIELD_DATA = {
  type: 'SET_FIELD_DATA';
  payload: { data: any; path: DotPath };
  // FIXME: this only work for the first time we set data. Subsequeent set data won't overwrite
  // This controls if we overwrite data or not on form init (defaultValue vs initial set data)
  updateIf: (currentValue: any) => boolean;
};

export type SET_ERROR = {
  type: 'SET_ERROR';
  payload: { error: FormStoreError };
};

export type Action =
  | INITIALIZE
  | SET_DATA
  | ADD_FIELD
  | REMOVE_FIELD
  | SET_FIELD_DATA
  | SET_ERROR;
