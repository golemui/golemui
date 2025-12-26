import { StandardSchemaV1 } from '@standard-schema/spec';
import * as Form from '../form';
import * as Field from '../form-field';
import { DotPath, Uid, UiState } from '../shared';

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

/**
 * Represents a form field whose value is derived from a computation
 * and evaluated against its previous derived state.
 *
 * A `DerivedField<T>` captures the source field, the previous derived value,
 * the newly derived value, and whether a structural change occurred between
 * derivations.
 */
export type DerivedField<F extends Field.FormField<string>> = {
  /** The source field from which the derived value is computed */
  source: Readonly<F>;
  /** The previously derived value */
  previous: Readonly<F>;
  /** The newly derived value */
  current: F;
  /** Indicates whether the newly derived value changed structurally */
  changed?: boolean;
};

export type State = {
  formName: string;

  /**
   * The complete form definition.
   */
  formDef: Form.Form<string>;

  /**
   * Flattened representation of `formDef` as a map from UID to field definition.
   * Enables more efficient lookup and processing in downstream operations.
   */
  flatForm: Record<Uid, Field.FormField<string>>;

  /**
   * List of states computed for the current form state.
   */
  currentStates: string[];

  /**
   * Tracks fields whose components have been rendered.
   * A field is added when its component mounts and removed when it unmounts.
   */
  calculatedFields: Record<Uid, DerivedField<Field.FormField<string>>>;

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
  flatForm: {},
  currentStates: [],
  calculatedFields: {},
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
