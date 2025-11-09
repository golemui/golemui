import * as Field from '../Field';
import * as Form from '../Form';
import { Uid } from '../shared';

export type FormStoreError =
  | { kind: 'none' }
  | { kind: 'fatal'; error: string | string[] }
  | { kind: 'validation'; errors: string[] };

export type State = {
  formName: string;
  /**
   * The complete form definition.
   * In most cases, use `calculatedForm` instead, as it excludes hidden fields.
   */
  formDef: Form.Form<string>;
  /**
   * Flattened version of `formDef`.
   * Useful for performing certain operations more efficiently.
   */
  flatForm: Field.FormField<string>[];
  /**
   * A namespace used to add flags or other properties unrelated to the form fields state
   * that we may need to track. For example, the state of a request through a `status` property.
   */
  formMeta: Record<string, any>;
  currentStates: string[];
  /**
   * Tracks fields whose components have been rendered.
   * A field is added when its component mounts and removed when it unmounts.
   */
  fields: Record<Uid, Field.FormField<string>>;
  /**
   * Tracks fields with state expressions.
   * When data changes, these fields are updated and their flags recalculated.
   */
  fieldFlags: Record<Uid, Field.Flags>;
  /**
   * Allows overriding a field’s `prop` properties externally via its event handler mechanism.
   * For example, this can be used to load options for a select field asynchronously.
   * Overridden props can also use the state syntax to update specific states only.
   */
  fieldPropOverrides: Record<Uid, Record<string, any>>;
  data: Record<string, any>;
  error: FormStoreError;
};

export const createInitialState = (): State => ({
  formName: '',
  formDef: Form.FormSchema.parse({
    form: Field.stack([] as Field.FormField[]),
  }) as Form.Form,
  flatForm: [],
  formMeta: {},
  currentStates: [],
  fields: {},
  fieldFlags: {},
  fieldPropOverrides: {},
  data: {},
  error: { kind: 'none' },
});

export type MiddlewareAPI<S, A> = {
  getState: () => S;
  dispatch: (action: A) => void;
};

export type Middleware<S, A> = (
  api: MiddlewareAPI<S, A>,
) => (next: (action: A) => void) => (action: A) => void;
