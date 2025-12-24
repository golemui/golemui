import { isControlField } from '../../form-field';
import * as Fn from '../../utils/function';
import { deleteKey } from '../../utils/object';
import { REMOVE_FIELD } from '../actions';
import { State } from '../model';

// TODO: should we remove data as well?
export function removeField(state: State, action: REMOVE_FIELD): State {
  return {
    ...state,
    fieldFlags: {
      ...deleteKey(state.fieldFlags, action.payload.uid),
    },
    fields: {
      ...deleteKey(state.fields, action.payload.uid),
    },
    fieldPropOverrides: {
      ...deleteKey(state.fieldPropOverrides, action.payload.uid),
    },
    calculatedFields: {
      ...deleteKey(state.calculatedFields, action.payload.uid),
    },
    touchedControls: {
      ...Fn.pipe(state.touchedControls, (ctrls) => {
        const field = state.flatForm[action.payload.uid];
        if (isControlField(field)) {
          return deleteKey(state.touchedControls, field.path);
        }
        return ctrls;
      }),
    },
  };
}
