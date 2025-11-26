import * as Form from '../../form';
import * as Field from '../../form-field';
import { flattenForm } from '../../utils/form';
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

  // defineForm() converts the form array into a layout (the formDef.form entry point).
  // When the form declaration originates from JSON (i.e., not via defineForm()),
  // the layout must be generated here instead.
  if (Array.isArray((formDef as Record<string, any>)['form'])) {
    const formDef_ = formDef as Record<string, any>;
    const fields: any[] = formDef_['form'];
    // mutate
    formDef_['form'] = {
      uid: '',
      widget: 'stack',
      kind: 'layout',
      children: fields,
    };
  }

  const { error, success, data } = Form.FormSchema.safeParse(formDef);

  if (success) {
    return {
      ...initialState,
      formDef: data as Form.Form,
      flatForm: flattenForm([data.form] as Field.FormField[]),
    };
  }

  return {
    ...initialState,
    error: { kind: 'fatal', error: error.message },
  };
};
