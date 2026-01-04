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
    // TODO: has this already been removed in calculate-field-props??? Do we need this at all?
    calculatedFields: {
      ...deleteKey(state.calculatedFields, action.payload.uid),
    },
    fieldPropOverrides: {
      ...deleteKey(state.fieldPropOverrides, action.payload.uid),
    },
    touchedControls: {
      ...Fn.pipe(state.touchedControls, (touchedControls) => {
        // TODO: this doesn't account for repeater items
        const field = state.flatForm[action.payload.uid];
        if (field && isControlField(field)) {
          return deleteKey(touchedControls, field.path);
        }
        return touchedControls;
      }),
    },
    // TODO: clear field from injectedValidations
  };
}
