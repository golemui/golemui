import { Subject } from 'rxjs';
import { createFormStore, type FormStore } from '../form-store';
import { type ValidatorFn } from '../form-validator';
import { type ActionWidget, type InputWidget, type LayoutWidget, type On } from '../form-widget';
import { type I18nTranslator, identityTranslator } from '../i18n';
import { type ItemRenderer } from '../item-renderer';
import {
  type EventHandlerCallback,
  type EventName,
  type FormEvent,
  type ValidateOn,
} from '../shared';
import { type Action } from '../store/actions';
import { type Middleware, type State } from '../store/model';
import { type WidgetLoaders, WidgetRegistry } from './widget-registry';

export class FormContext<ComponentType> {
  widgetRegistry = new WidgetRegistry<ComponentType>();
  store: FormStore = {} as FormStore;
  events$ = new Subject<FormEvent>();
  uuid = crypto.randomUUID();
  itemRenderers: Record<string, ItemRenderer> = {};
  localization!: I18nTranslator;
  /**
   * Dependencies are any 3rd party service components may need internally.
   * e.g. a markdown parser for the Markdown component
   */
  dependencies: Record<string, unknown> = {};

  initialize(
    widgetLoaders: WidgetLoaders<ComponentType>,
    middlewares: Middleware<State, Action>[] = [],
    validators: ValidatorFn<any>,
    validateOn: ValidateOn,
    itemRenderers: Record<string, ItemRenderer>,
    localization: I18nTranslator = identityTranslator(),
    dependencies: Record<string, unknown>,
  ) {
    this.localization = localization;
    this.dependencies = dependencies;
    this.widgetRegistry.setWidgetLoaders(widgetLoaders);
    this.itemRenderers = itemRenderers;
    this.store = createFormStore(middlewares, validators, validateOn, localization);
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

    // More than one event can be emitted if more than one currentstate matches
    if (matchedStates.length > 0) {
      matchedStates.forEach((currentState) => {
        const eventName = widget.on?.[`${eventType}.${currentState}`] as EventName | undefined;
        this.attemptValidation(eventType, eventName, widget);
        if (eventName) {
          this.events$.next({
            name: eventName,
            data: this.store.getState().data,
            detail: detail ?? undefined,
            callback: (action: EventHandlerCallback) => {
              this.store.dispatch(action);
            },
          });
        }
      });
    } else {
      const eventName = widget.on?.[eventType] as EventName | undefined;
      this.attemptValidation(eventType, eventName, widget);
      if (eventName) {
        this.events$.next({
          name: eventName,
          data: this.store.getState().data,
          detail: detail,
          callback: (action: EventHandlerCallback) => {
            this.store.dispatch(action);
          },
        });
      }
    }
  }

  private attemptValidation(
    eventType: keyof On<string>,
    eventName: EventName | undefined,
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
    } else if (eventType === 'click' && eventName === ('submit' satisfies ValidateOn)) {
      this.store.dispatch({
        type: 'VALIDATE_ALL',
      });
    }
  }
}
