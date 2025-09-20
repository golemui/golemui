import * as Form from '../Form';
import { Action } from './actions';
import { createInitialState, FormStoreError, State } from './model';

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INITIALIZE': {
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
    }

    default: {
      return state;
    }
  }
}
