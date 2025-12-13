import { FormField } from '../../form-field';
import { FormStoreError, State } from '../model';

const extractFunctionsByUid = (fields: FormField<string>[]) => {
  const flatRegistry: any = {};

  fields.forEach((field) => {
    Object.keys(field).forEach((prop) => {
      // Field properties
      if (typeof (field as any)[prop] === 'function') {
        if (!flatRegistry[field.uid]) {
          flatRegistry[field.uid] = {};
        }
        flatRegistry[field.uid][prop] = (field as any)[prop];
      }

      // Field "props" properties
      if (prop === 'props' && field[prop]) {
        Object.keys(field[prop]).forEach((pProp) => {
          if (typeof (field[prop] as any)[pProp] === 'function') {
            if (!flatRegistry[field.uid]) {
              flatRegistry[field.uid] = {
                props: {},
              };
            }
            flatRegistry[field.uid].props[pProp] = (field[prop] as any)[pProp];
          }
        });
      }
    });
  });

  return flatRegistry;
};

export const calculateCurrentFunctions = (state: State): State => {
  const currentFunctions: any = extractFunctionsByUid(state.flatForm);
  const error: FormStoreError = { kind: 'none' };
  return {
    ...state,
    currentFieldFunctions: { ...state.currentFieldFunctions, ...currentFunctions },
    error,
  };
};
