import { type Observable } from 'rxjs';
import { type FormStore } from './form-store';
import { type ActionWidget, type InputWidget, type LayoutWidget, type On } from './form-widget';
import { type I18nTranslator } from './i18n';
import { type DotPath, type FormEvent, type FormSubmitEvent } from './shared';
import { type ValueSchemaResolver } from './value-schema';

/**
 * What a form plugin can reach. Built by `FormContext.attachPlugins` for one store
 * initialization and frozen, so a plugin cannot alter what its siblings see.
 */
export type FormPluginContext = {
  /** The form store: `getState`, `dispatch`, and the `state$` stream. */
  store: FormStore;
  /** The form's translator, for resolving `Localizable` texts the way the widgets do. */
  localization: I18nTranslator;
  /** Widget events routed to the host (`on.*` handlers). */
  events$: Observable<FormEvent>;
  /** Submits that passed validation, the same stream the framework bindings forward to the host. */
  submit$: Observable<FormSubmitEvent>;
  /** The widget set's description of the values its widgets hold, when it declares one. */
  valueSchemas?: ValueSchemaResolver;
  /**
   * Runs the submit path: `VALIDATE_ALL`, then a `submit$` emission when the form is valid.
   * Returns true when the submit was emitted.
   */
  submit(): boolean;
  /**
   * Emits a widget event exactly like a user interaction does: runs the widget's `on.*`
   * handlers and the validation the form's `validateOn` setting allows for that event.
   */
  emitEvent(
    eventType: keyof On<string>,
    widget: InputWidget<any, string> | ActionWidget<string> | LayoutWidget<string>,
    detail?: unknown,
  ): void;
  /**
   * Validates the current data without dispatching: no action, no touched state, nothing
   * rendered. Merges the schema validations with the injected ones, keyed by data path.
   */
  validate(): FormValidationReport;
};

/** The result of {@link FormPluginContext.validate}. */
export type FormValidationReport = {
  isValid: boolean;
  errors: Record<DotPath, string[]>;
};

/** Returned by a plugin to be called when the plugin is detached. */
export type FormPluginTeardown = () => void;

/**
 * A runtime extension of one form. Attached by the framework binding once the form is live
 * on the client (after `INITIALIZE`, `SET_DATA` and `SET_META` ran) and detached when the form
 * is torn down or re-initialized. Never attached during a server render.
 *
 * Declared in `FormInitConfig.plugins`. A plugin that throws while attaching is skipped and
 * reported through `console.error`; the form keeps working.
 *
 * @example
 * const logger: FormPlugin = ({ store }) => {
 *   const subscription = store.state$.subscribe((state) => console.log(state.data));
 *   return () => subscription.unsubscribe();
 * };
 */
export type FormPlugin = (context: FormPluginContext) => void | FormPluginTeardown;
