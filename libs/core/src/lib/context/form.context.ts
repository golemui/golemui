import { Subject } from 'rxjs';
import { ControlField, InteractiveField, LayoutField, On } from '../form-field';
import { createFormStore, FormStore } from '../form-store';
import { ValidatorFn } from '../form-validator';
import { EventHandlerCallback, EventName, FormEvent, ValidateOn } from '../shared';
import { Action } from '../store/actions';
import { Middleware, State } from '../store/model';
import { FieldLoaders, FieldRegistry } from './field.registry';

export class FormContext<ComponentType> {
  fieldRegistry = new FieldRegistry<ComponentType>();
  store: FormStore = {} as FormStore;
  events$ = new Subject<FormEvent>();
  uuid = crypto.randomUUID();

  initialize(
    fieldLoaders: FieldLoaders<ComponentType>,
    middlewares: Middleware<State, Action>[] = [],
    validators: ValidatorFn<any>,
    validateOn: ValidateOn,
  ) {
    this.fieldRegistry.setFieldLoaders(fieldLoaders);
    this.store = createFormStore(middlewares, validators, validateOn);
  }

  emitEvent(
    eventType: keyof On<string>,
    field: ControlField<any, string> | InteractiveField<string> | LayoutField<string>,
    detail?: any,
  ) {
    const currentStates = this.store.getState().currentStates;
    const matchedStates = currentStates.filter((currentState) => {
      return field.on?.[`${eventType}.${currentState}`] !== undefined;
    });

    // More than one event can be emitted if more than one currentstate matches
    if (matchedStates.length > 0) {
      matchedStates.forEach((currentState) => {
        const eventName = field.on?.[`${eventType}.${currentState}`] as EventName | undefined;
        this.attemptValidation(eventType, eventName, field);
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
      const eventName = field.on?.[eventType] as EventName | undefined;
      this.attemptValidation(eventType, eventName, field);
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

  attemptValidation(
    eventType: keyof On<string>,
    eventName: EventName | undefined,
    field: ControlField<any, string> | InteractiveField<string> | LayoutField<string>,
  ) {
    // TODO: Remove this if field.kind !== 'layout', find a way to avoid attempt validations with layouts
    // We don't validate layouts
    if (field.kind !== 'layout') {
      if (eventType === 'change') {
        this.store.dispatch({
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'change', path: (field as ControlField<any, string>).path },
        });
      } else if (eventType === 'click' && eventName === ('submit' satisfies ValidateOn)) {
        this.store.dispatch({
          type: 'VALIDATE_ALL',
        });
      }
    }
  }
}
