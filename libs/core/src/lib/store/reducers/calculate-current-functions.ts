import { FormField, isControlField, isInteractiveField, On } from '../../form-field';
import { Uid } from '../../shared';
import { set } from '../../utils/object';
import { FormStoreError, State } from '../model';

const extractFunctionsByUid = (fields: FormField<string>[]) => {
  const flatRegistry: Record<Uid, any> = {};

  fields.forEach((field) => {
    type CoreProp = keyof FormField;
    // Field core properties
    Object.keys(field).forEach((prop) => {
      if (typeof field[prop as CoreProp] === 'function') {
        set(flatRegistry, `${field.uid}.${prop}`, field[prop as CoreProp]);
      }
    });

    // Field "props" properties
    Object.keys(field.props || {}).forEach((prop) => {
      if (typeof field.props?.[prop] === 'function') {
        set(flatRegistry, `${field.uid}.props.${prop}`, field.props[prop]);
      }
    });

    type OnProp = keyof On;
    // Field "on" properties
    if (isControlField(field) || isInteractiveField(field)) {
      Object.keys(field.on || {}).forEach((prop) => {
        if (typeof field.on?.[prop as OnProp] === 'function') {
          set(flatRegistry, `${field.uid}.on.${prop}`, field.on[prop as OnProp]);
        }
      });
    }
    //
  });

  return flatRegistry;
};

export const calculateCurrentFunctions = (state: State): State => {
  // TODO: why is this error reset necessary?
  const error: FormStoreError = { kind: 'none' };
  return {
    ...state,
    // TODO: this should be replacement not override
    currentFieldFunctions: {
      ...state.currentFieldFunctions,
      // TODO: Use State.fields to target only the fields that are rendered
      ...extractFunctionsByUid(state.flatForm),
    },
    error,
  };
};
