import { DotPath } from '../shared';
import { FormStoreError } from './model';

export type INITIALIZE = {
  type: 'INITIALIZE';
  payload: { formDef: string | Record<string, any>; formName: string };
};

export type SET_DATA = {
  type: 'SET_DATA';
  payload: { data: Record<string, any> };
};

export type SET_FIELD_DATA = {
  type: 'SET_FIELD_DATA';
  payload: { data: any; path: DotPath };
};

export type SET_ERROR = {
  type: 'SET_ERROR';
  payload: { error: FormStoreError };
};

export type Action = INITIALIZE | SET_DATA | SET_FIELD_DATA | SET_ERROR;
