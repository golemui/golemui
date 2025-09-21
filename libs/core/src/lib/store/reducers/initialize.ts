import * as Form from '../../Form';
import * as Actions from '../actions';
import { createInitialState, FormStoreError, State } from '../model';

export const initialize = (_: State, action: Actions.INITIALIZE): State => {
  const initialState = {
    ...createInitialState(),
    formName: action.payload.formName,
  };
  let formDef = action.payload.formDef;
  let formStoreError: FormStoreError = { kind: 'none' };

  if (typeof formDef === 'string') {
    try {
      formDef = JSON.parse(formDef);
    } catch {
      formStoreError = { kind: 'fatal', error: 'Invalid JSON form schema' };
    }
    if (formStoreError.kind === 'fatal') {
      return { ...initialState, error: formStoreError };
    }
  }

  const { error, success, data } = Form.FormSchema.safeParse(formDef);

  if (success) {
    return { ...initialState, formDef: data as Form.Form };
  }

  return {
    ...initialState,
    error: { kind: 'fatal', error: error.message },
  };
};
