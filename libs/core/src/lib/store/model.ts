import { type Form, formDefDecoder } from '../form';
import type { FormWidget, FunctionWidget } from '../form-widget';
import { type DotPath, type Uid, type ValidationStatus } from '../shared';

// ------------------------------
//
// Store state
//
// ------------------------------

export type State = {
  formName: string;

  /**
   * The complete form definition.
   */
  formDef: Form<string>;

  /**
   * Flattened representation of `formDef` as a map from UID to widget definition.
   * Enables more efficient lookup and processing in downstream operations.
   */
  flatForm: Record<Uid, FormWidget<string>>;

  /**
   * `flatForm` plus one entry per repeater row widget, keyed by concrete uid.
   * Row entries carry the row indexes in `uid` and (for inputs) `path`, and include the row layout node
   * and nested repeater containers. Function widgets stay callable, `when` expressions are not rewritten.
   * Pure function of `(flatForm, data)`, built by `expandSources` on every reducer pipeline run.
   * Read by `calculateWidgetFlags` and `pruneHiddenData`.
   *
   * @example { 'quantity-number[0]': { uid: 'quantity-number[0]', path: 'lineItems.0.quantity', ... } }
   */
  resolvedSources: Record<Uid, FormWidget<string>>;

  /**
   * List of states computed for the current form state.
   */
  currentStates: string[];

  /**
   * The resolved widget for every visible widget in `resolvedSources`, recomputed from the data on
   * every derive. Independent of which components are mounted. Hidden widgets have no entry.
   */
  calculatedWidgets: Record<Uid, DerivedWidget<FormWidget<string>>>;

  /**
   * Validations statuses derived from the schema validators expressed declaratively.
   *
   * These validation statuses are produced automatically by the configured schema
   * validators (e.g. zod), and are fully managed by the validation engine and should
   * not be mutated directly.
   */
  validations: Record<DotPath, ValidationStatus>;

  /**
   * Tracks controls that have been _touched_ hence can display validation errors.
   */
  touchedControls: Record<DotPath, boolean>;

  /**
   * Validation statuses injected imperatively via the public API.
   *
   * These validation statuses are not derived from the schema validators and are intended
   * for contextual validations that cannot be expressed declaratively.
   */
  injectedValidations: Record<DotPath, ValidationStatus>;

  /**
   * caclulated each time the validation kicks-in. It atkes into account both `validations` and `injectedValidations`.
   */
  isFormValid: boolean;

  /**
   * Tracks widgets with state expressions.
   * When data changes, these widgets are updated and their flags recalculated.
   */
  widgetFlags: Record<Uid, { hidden?: boolean; readonly?: boolean; disabled?: boolean }>;

  /**
   * Maps every widget produced by a repeater item (by its concrete uid) to the repeater item that owns it.
   * Used to bind the `$item` and `$index` expression scope variables.
   * For nested repeaters the entry points to the innermost enclosing item.
   * Built by `expandSources` together with `resolvedSources`.
   *
   * @example { 'quantity-number[0]': { itemPath: 'lineItems.0', index: 0 } }
   * @example Nested repeater, keyed by the innermost item: { 'dev-name[2][0]': { itemPath: 'teams.2.devs.0', index: 0 } }
   */
  repeaterItemScopes: Record<Uid, RepeaterItemScope>;

  /**
   * Allows overriding a widget's `prop` properties externally via its event handler mechanism.
   * For example, this can be used to load options for a select widget asynchronously.
   */
  widgetPropOverrides: Record<Uid, Record<string, any>>;

  /**
   * Key-value pairs representing the current state of the form's input fields.
   * The keys correspond to the control names.
   */
  data: Record<string, any>;

  /**
   * Supplemental runtime context used for form logic, calculations, and UI state.
   * Includes external dependencies like display flags or error messages.
   * @example { errorMessage: "Invalid credentials", isAuth: true }
   */
  meta: Record<string, any>;

  /**
   * This reflects whether the form is currently functioning normally
   * or is in an errored state.
   */
  formHealth: FormHealth;

  /**
   * Indicates whether the user has interacted with the form.
   * Set to true when a validateOn-type event occurs on any form control.
   */
  touched: boolean;

  /**
   * True once a VALIDATE_ALL pass has run (typically a submit attempt).
   * Input widgets added afterwards are immediately marked as touched.
   */
  allControlsValidated: boolean;

  /**
   * The BCP 47 language tag of the current locale (e.g., 'en-US', 'es', 'fr-CA').
   */
  lang: string;
};

export const createInitialState = (lang: string): State => ({
  formName: '',
  formDef: formDefDecoder.parse({
    form: {
      kind: 'layout',
      type: 'flex',
      children: [],
    },
  }) as Form,
  flatForm: {},
  resolvedSources: {},
  currentStates: [],
  calculatedWidgets: {},
  validations: {},
  touchedControls: {},
  injectedValidations: {},
  isFormValid: true,
  widgetFlags: {},
  repeaterItemScopes: {},
  widgetPropOverrides: {},
  data: {},
  meta: {},
  formHealth: { status: 'ok' },
  touched: false,
  allControlsValidated: false,
  lang,
});

// ------------------------------
//
// TYPES
//
// ------------------------------

export type MiddlewareAPI<S, A> = {
  getState: () => S;
  dispatch: (action: A) => void;
};

export type Middleware<S, A> = (
  api: MiddlewareAPI<S, A>,
) => (next: (action: A) => void) => (action: A) => void;

/**
 * Identifies the repeater item that owns a widget rendered inside a repeater `props.template`.
 */
export type RepeaterItemScope = {
  /** Data path of the owning item, e.g. `lineItems.0` */
  itemPath: DotPath;
  /** Zero-based position of the owning item in the repeater array */
  index: number;
};

/**
 * Represents the current operational state of the form.
 * When in an errored state, the form is considered non-operational
 * until the error is cleared.
 */
export type FormHealth =
  | { status: 'ok' }
  | {
      status: 'errored';
      message: string;
      /**
       * error codes below 1000 are reserved for the core
       */
      code: number;
    };

/**
 * Represents a form widget whose value is derived from a computation.
 *
 * A `DerivedWidget<T>` captures the source widget definition and the most
 * recently computed, fully resolved widget. Reference identity is used for
 * change detection: a new object is created only when a property has changed.
 */
export type DerivedWidget<F extends FormWidget<string>> = {
  /** The source widget from which the derived value is computed */
  source: F;
  /** The most recently computed, fully resolved widget */
  current: Exclude<F, FunctionWidget<string>>;
};
