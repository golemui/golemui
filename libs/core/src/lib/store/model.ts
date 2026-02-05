import * as Form from '../form';
import * as Widget from '../form-widget';
import { DotPath, Uid, ValidationStatus } from '../shared';

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
  formDef: Form.Form<string>;

  /**
   * Flattened representation of `formDef` as a map from UID to widget definition.
   * Enables more efficient lookup and processing in downstream operations.
   */
  flatForm: Record<Uid, Widget.FormWidget<string>>;

  /**
   * List of states computed for the current form state.
   */
  currentStates: string[];

  /**
   * Tracks widgets whose components have been rendered.
   * A widget is added when its component mounts and removed when it unmounts.
   */
  calculatedWidgets: Record<Uid, DerivedWidget<Widget.FormWidget<string>>>;

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
   * Tracks widgets with state expressions.
   * When data changes, these widgets are updated and their flags recalculated.
   */
  widgetFlags: Record<Uid, Widget.Flags>;

  /**
   * Allows overriding a widget’s `prop` properties externally via its event handler mechanism.
   * For example, this can be used to load options for a select widget asynchronously.
   */
  widgetPropOverrides: Record<Uid, Record<string, any>>;

  data: Record<string, any>;

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
   * The BCP 47 language tag of the current locale (e.g., 'en-US', 'es', 'fr-CA').
   */
  lang: string;
};

export const createInitialState = (lang: string): State => ({
  formName: '',
  formDef: Form.formDefDecoder.parse({
    form: {
      kind: 'layout',
      type: 'stack',
      children: [],
    },
  }) as Form.Form,
  flatForm: {},
  currentStates: [],
  calculatedWidgets: {},
  validations: {},
  touchedControls: {},
  injectedValidations: {},
  widgetFlags: {},
  widgetPropOverrides: {},
  data: {},
  formHealth: { status: 'ok' },
  touched: false,
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
 * Represents the current operational state of the form.
 * When in an errored state, the form is considered non-operational
 * until the error is cleared.
 */
export type FormHealth = { status: 'ok' } | { status: 'errored'; message: string };

/**
 * Represents a form widget whose value is derived from a computation
 * and evaluated against its previous derived state.
 *
 * A `DerivedWidget<T>` captures the source widget, the previous derived value,
 * the newly derived value, and whether a structural change occurred between
 * derivations.
 */
export type DerivedWidget<F extends Widget.FormWidget<string>> = {
  /** The source widget from which the derived value is computed */
  source: F;
  /** The previously derived value */
  previous: Exclude<F, Widget.FunctionWidget<string>>;
  /** The newly derived value */
  current: Exclude<F, Widget.FunctionWidget<string>>;
  /** Indicates whether the newly derived value changed structurally */
  changed?: boolean;
};
