import { Subject } from 'rxjs';
import { createFormStore, type FormStore } from '../form-store';
import { type ValidatorFn } from '../form-validator';
import { type ActionWidget, type InputWidget, type LayoutWidget, type On } from '../form-widget';
import { type I18nTranslator, identityTranslator } from '../i18n';
import { type ItemRenderer } from '../item-renderer';
import {
  type FormPlugin,
  type FormPluginContext,
  type FormPluginTeardown,
  type FormValidationReport,
} from '../plugin';
import {
  type EventHandlerCallback,
  type EventName,
  type ExpressionFunctions,
  type FormEvent,
  type FormSubmitEvent,
  type ValidateOn,
} from '../shared';
import { type Action } from '../store/actions';
import { type Middleware, type State } from '../store/model';
import { calculateIsFormValid } from '../store/reducer';
import { validateAll } from '../store/reducers/validate-all';
import { pruneHiddenData } from '../utils/form';
import { type ValueSchemaResolver } from '../value-schema';
import { type WidgetLoaders, WidgetRegistry } from './widget-registry';

export class FormContext<ComponentType> {
  widgetRegistry = new WidgetRegistry<ComponentType>();
  store: FormStore = {} as FormStore;
  events$ = new Subject<FormEvent>();
  submit$ = new Subject<FormSubmitEvent>();
  itemRenderers: Record<string, ItemRenderer> = {};
  localization!: I18nTranslator;
  /**
   * Dependencies are any 3rd party service components may need internally.
   * e.g. a markdown parser for the Markdown component
   */
  dependencies: Record<string, unknown> = {};
  /**
   * The widget set's description of the values its widgets hold, when it declares one.
   * Routed to plugins, never read by the core.
   */
  valueSchemas: ValueSchemaResolver | undefined = undefined;

  private validators: ValidatorFn<any> | undefined;
  private pluginTeardowns: FormPluginTeardown[] = [];

  initialize(
    widgetLoaders: WidgetLoaders<ComponentType>,
    middlewares: Middleware<State, Action>[] = [],
    validators: ValidatorFn<any>,
    validateOn: ValidateOn,
    itemRenderers: Record<string, ItemRenderer>,
    localization: I18nTranslator = identityTranslator(),
    dependencies: Record<string, unknown>,
    functions: ExpressionFunctions = {},
    valueSchemas?: ValueSchemaResolver,
  ) {
    this.localization = localization;
    this.dependencies = dependencies;
    this.valueSchemas = valueSchemas;
    this.validators = validators;
    this.widgetRegistry.setWidgetLoaders(widgetLoaders);
    this.itemRenderers = itemRenderers;
    this.store = createFormStore(middlewares, validators, validateOn, localization, functions);
  }

  emitEvent(
    eventType: keyof On<string>,
    widget: InputWidget<any, string> | ActionWidget<string> | LayoutWidget<string>,
    detail?: any,
  ) {
    const currentStates = this.store.getState().currentStates;
    const matchedStates = currentStates.filter((currentState) => {
      return widget.on?.[`${eventType}.${currentState}`] !== undefined;
    });

    // Once per event, not once per matched state: N matching handlers used to run N full
    // validate-and-derive passes for one change.
    this.attemptValidation(eventType, widget);

    // More than one event can be emitted if more than one currentstate matches
    if (matchedStates.length > 0) {
      matchedStates.forEach((currentState) => {
        const eventName = widget.on?.[`${eventType}.${currentState}`] as EventName | undefined;
        if (eventName) {
          this.events$.next({
            name: eventName,
            data: pruneHiddenData(this.store.getState()),
            detail: detail ?? undefined,
            callback: (action: EventHandlerCallback) => {
              this.store.dispatch(action);
            },
          });
        }
      });
    } else {
      const eventName = widget.on?.[eventType] as EventName | undefined;
      if (eventName) {
        this.events$.next({
          name: eventName,
          data: pruneHiddenData(this.store.getState()),
          detail: detail,
          callback: (action: EventHandlerCallback) => {
            this.store.dispatch(action);
          },
        });
      }
    }
  }

  /**
   * Runs the submit path: validates every input and, when the form is valid, emits on `submit$`.
   * @returns True when the submit was emitted, false when validation held it back.
   */
  emitSubmitEvent(): boolean {
    this.store.dispatch({
      type: 'VALIDATE_ALL',
    });

    if (!this.store.getState().isFormValid) {
      return false;
    }

    this.submit$.next({
      data: pruneHiddenData(this.store.getState()),
      callback: (action: EventHandlerCallback) => {
        this.store.dispatch(action);
      },
    });
    return true;
  }

  /**
   * Validates the current data without dispatching anything: the store, the touched state and
   * the rendered errors stay as they are. Runs the same schema validators the reducer runs
   * over the visible inputs, and merges the injected validations in.
   */
  validate(): FormValidationReport {
    const validators = this.validators;
    if (validators === undefined) {
      return { isValid: true, errors: {} };
    }
    const validated = calculateIsFormValid(
      validateAll(validators, this.localization)(this.store.getState()),
    );
    const errors: FormValidationReport['errors'] = {};
    for (const [path, issues] of Object.entries(validated.validations)) {
      if (issues !== null && issues.length > 0) {
        errors[path] = [...issues];
      }
    }
    for (const [path, issues] of Object.entries(validated.injectedValidations)) {
      if (issues !== null && issues.length > 0) {
        errors[path] = [...(errors[path] ?? []), ...issues];
      }
    }
    return { isValid: validated.isFormValid, errors };
  }

  /**
   * Attaches the form's plugins to the current store. Detaches the previously attached ones
   * first, so calling it again after a re-initialization is safe. A plugin that throws is
   * skipped and reported; the form keeps working.
   *
   * Framework bindings call this on the client once the store is initialized and the initial
   * data and meta are dispatched, never during a server render.
   */
  attachPlugins(plugins: FormPlugin[]): void {
    this.detachPlugins();
    if (plugins.length === 0) {
      return;
    }
    const context = this.createPluginContext();
    for (const plugin of plugins) {
      try {
        const teardown = plugin(context);
        if (typeof teardown === 'function') {
          this.pluginTeardowns.push(teardown);
        }
      } catch (err) {
        console.error('[GolemUI] A form plugin failed to attach and was skipped:', err);
      }
    }
  }

  /**
   * Runs the teardown of every attached plugin, once. Safe to call when nothing is attached.
   */
  detachPlugins(): void {
    const teardowns = this.pluginTeardowns;
    this.pluginTeardowns = [];
    for (const teardown of teardowns) {
      try {
        teardown();
      } catch (err) {
        console.error('[GolemUI] A form plugin failed to detach:', err);
      }
    }
  }

  private createPluginContext(): FormPluginContext {
    return Object.freeze<FormPluginContext>({
      store: this.store,
      localization: this.localization,
      events$: this.events$.asObservable(),
      submit$: this.submit$.asObservable(),
      valueSchemas: this.valueSchemas,
      submit: () => this.emitSubmitEvent(),
      emitEvent: (eventType, widget, detail) => this.emitEvent(eventType, widget, detail),
      validate: () => this.validate(),
    });
  }

  private attemptValidation(
    eventType: keyof On<string>,
    widget: InputWidget<any, string> | ActionWidget<string> | LayoutWidget<string>,
  ) {
    // Some layouts (e.g. tabs that are clicked) emit events, but we don't trigger validation for them.
    if (widget.kind === 'layout') {
      return;
    }

    if (eventType === 'change') {
      this.store.dispatch({
        type: 'ATTEMPT_VALIDATION',
        payload: {
          reason: 'change',
          path: (widget as InputWidget<any, string>).path,
          uid: widget.uid,
        },
      });
    } else if (
      eventType === 'click' &&
      widget.kind === 'action' &&
      widget.actionType === 'submit'
    ) {
      this.store.dispatch({
        type: 'VALIDATE_ALL',
      });
    }
  }
}
