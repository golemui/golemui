import { StandardSchemaV1 } from '@standard-schema/spec';
import * as Form from '../form';
import * as Field from '../form-field';
import { DotPath, ReactiveFormField, Uid, UiState } from '../shared';

export type FormStoreError =
  | { kind: 'none' }
  | { kind: 'fatal'; error: string | string[] }
  // TODO: Is this still needed since we have proper validators now?
  | { kind: 'validation'; errors: string[] };

export type ValidationState = {
  /**
   * Cache of calculated schemas
   */
  validators: Record<UiState, StandardSchemaV1>;
  /**
   * Current status
   */
  status: null | { errors: string[] };
};

export type State = {
  formName: string;
  /**
   * The complete form definition.
   */
  formDef: Form.Form<string>;
  /**
   * Flattened version of `formDef`.
   * Useful for performing certain operations more efficiently.
   * // TODO: Is this safe? What about sigle source of truth? this might be problematic if fields get out of sync (keep an eye on this)
   */
  flatForm: Field.FormField<string>[];
  /**
   * A namespace used to add flags or other properties unrelated to the form fields state
   * that we may need to track. For example, the state of a request through a `status` property.
   */
  formMeta: Record<string, any>;
  /**
   * List of states computed for the current form state.
   */
  currentStates: string[];
  /**
   * List of field functions computed for the current form state.
   */
  currentFieldFunctions: Record<Uid, ReactiveFormField>;
  /**
   * Tracks fields whose components have been rendered.
   * A field is added when its component mounts and removed when it unmounts.
   */
  fields: Record<Uid, Field.FormField<string>>;
  /**
   * Tracks field validation status.
   */
  validations: Record<DotPath, ValidationState>;
  /**
   * Tracks fields with state expressions.
   * When data changes, these fields are updated and their flags recalculated.
   */
  fieldFlags: Record<Uid, Field.Flags>;

  /**
   * Tracks controls that have been _touched_ hence can display validation errors.
   */
  touchedControls: Record<DotPath, boolean>;
  /**
   * Allows overriding a field’s `prop` properties externally via its event handler mechanism.
   * For example, this can be used to load options for a select field asynchronously.
   * Overridden props can also use the state syntax to update specific states only.
   */
  fieldPropOverrides: Record<Uid, Record<string, any>>;
  data: Record<string, any>;
  error: FormStoreError;
  /**
   * Indicates whether the user has interacted with the form.
   * Set to true when a validateOn-type event occurs on any form control.
   */
  touched: boolean;
};

export const createInitialState = (): State => ({
  formName: '',
  formDef: Form.formDefDecoder.parse({
    form: {
      widget: 'stack',
      kind: 'layout',
      children: [],
    },
  }) as Form.Form,
  flatForm: [],
  formMeta: {},
  currentStates: [],
  currentFieldFunctions: {},
  fields: {},
  validations: {},
  fieldFlags: {},
  touchedControls: {},
  fieldPropOverrides: {},
  data: {},
  error: { kind: 'none' },
  touched: false,
});

export type MiddlewareAPI<S, A> = {
  getState: () => S;
  dispatch: (action: A) => void;
};

export type Middleware<S, A> = (
  api: MiddlewareAPI<S, A>,
) => (next: (action: A) => void) => (action: A) => void;
