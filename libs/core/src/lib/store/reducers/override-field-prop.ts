import { isControlField } from '../../form-field';
import * as Actions from '../actions';
import { State } from '../model';

// TODO: refactor, we may also want to override field's or layout's props, not only controls'. So don't use doPath, use uid in the action.
export const overrideFieldProp = (
  state: State,
  { payload }: Actions.OVERRIDE_FIELD_PROP,
): State => {
  const control = Object.values(state.fields).find(
    (field) => isControlField(field) && field.path === payload.path,
  );
  if (!control) {
    console.warn(`Control "${payload.path}" not found`);
    return state;
  }
  const propOverrides = state.fieldPropOverrides[control.uid] || {};
  return {
    ...state,
    fieldPropOverrides: { [control.uid]: { ...propOverrides, [payload.prop]: payload.value } },
  };
};

export const overrideFieldPropByFunction = (
  state: State,
  { payload }: Actions.OVERRIDE_FIELD_PROP_BY_FUNCTION,
): any => {
  const control = Object.values(state.fields).find((field) => field.uid === payload.uid);
  if (!control) {
    console.warn(`Control "${payload.uid}" not found`);
    return null;
  }
  return { [payload.prop]: payload.value };
};
