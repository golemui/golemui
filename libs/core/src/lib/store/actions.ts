import { FormField } from '../form-field';
import { DotPath, Uid } from '../shared';
import { FormStoreError } from './model';

export type INITIALIZE = {
  type: 'INITIALIZE';
  payload: { formDef: string | Record<string, any>; formName: string };
};

/**
 * Sets the data for the entire form.
 */
export type SET_DATA = {
  type: 'SET_DATA';
  payload: { data: Record<string, any> };
};

export type ADD_FIELD = {
  type: 'ADD_FIELD';
  payload: { field: FormField<string> };
};

export type REMOVE_FIELD = {
  type: 'REMOVE_FIELD';
  payload: { uid: Uid };
};

/**
 * Sets the data for a single form field.
 */
export type SET_FIELD_DATA = {
  type: 'SET_FIELD_DATA';
  payload: { path: DotPath; data: any };
  // FIXME: this only work for the first time we set data. Subsequeent set data won't overwrite
  // This controls if we overwrite data or not on form init (defaultValue vs initial set data)
  updateIf: (currentValue: any) => boolean;
};

/**
 * Overrides a property in a form field's `props` object.
 */
export type OVERRIDE_FIELD_PROP = {
  type: 'OVERRIDE_FIELD_PROP';
  payload: { path: DotPath; prop: string; value: any };
};

export type SET_ERROR = {
  type: 'SET_ERROR';
  payload: { error: FormStoreError };
};

export type TOUCHED = {
  type: 'TOUCHED';
};

export type Action =
  | INITIALIZE
  | SET_DATA
  | ADD_FIELD
  | REMOVE_FIELD
  | SET_FIELD_DATA
  | OVERRIDE_FIELD_PROP
  | SET_ERROR
  | TOUCHED;
