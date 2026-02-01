import * as Form from '../../form';
import * as Field from '../../form-field';
import { flattenForm, uidCollisionErrorMessage } from '../../utils/form';
import * as Actions from '../actions';
import { createInitialState, FormHealth, State } from '../model';

export const initialize = ({ lang }: State, action: Actions.INITIALIZE): State => {
  const initialState = {
    ...createInitialState(lang),
    formName: action.payload.formName,
  };
  let formDef = action.payload.formDef;
  let formHealth: FormHealth = { status: 'ok' };

  if (typeof formDef === 'string') {
    try {
      formDef = JSON.parse(formDef);
    } catch (err: unknown) {
      formHealth = {
        status: 'errored',
        message: (err as Error).message,
      };
    }
    if (formHealth.status === 'errored') {
      return { ...initialState, formHealth };
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

  const result = Form.formDefDecoder.decode(formDef);

  if (result.isOk()) {
    formHealth = { status: 'ok' };
    let flatForm = {} as State['flatForm'];
    try {
      flatForm = flattenForm([result.value.form] as Field.FormField[]).reduce(
        (acc, cur) => {
          if (acc[cur.uid!]) {
            throw { existingField: acc[cur.uid!], newField: cur };
          }
          acc[cur.uid!] = cur;
          return acc;
        },
        {} as State['flatForm'],
      );
    } catch (error: any) {
      formHealth = {
        status: 'errored',
        message: uidCollisionErrorMessage(error.existingField, error.newField),
      };
      flatForm = {};
    }

    return {
      ...initialState,
      formDef: result.value as Form.Form,
      flatForm,
      formHealth,
    };
  }

  return {
    ...initialState,
    formHealth: {
      status: 'errored',
      message: result.error,
    },
  };
};
