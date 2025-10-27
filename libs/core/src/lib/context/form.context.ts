import { Subject } from 'rxjs';
import { ButtonField, ControlField, On } from '../Field';
import { createFormStore, FormStore } from '../FormStore';
import { EventHandlerCallback, EventName, FormEvent } from '../shared';
import { Action } from '../store/actions';
import { Middleware, State } from '../store/model';
import { FieldLoaders, FieldRegistry } from './field.registry';

export class FormContext<ComponentType> {
  fieldRegistry = new FieldRegistry<ComponentType>();
  store: FormStore = {} as FormStore;
  events$ = new Subject<FormEvent>();

  initialize(
    fieldLoaders: FieldLoaders<ComponentType>,
    middlewares: Middleware<State, Action>[] = [],
  ) {
    this.fieldRegistry.setFieldLoaders(fieldLoaders);
    this.store = createFormStore(middlewares);
  }

  // FIXME: Not type safety
  getPropertyValueByCurrentState<T>(property: string, obj: Record<string, any>): T | undefined {
    const currentStates = this.store.getState().currentStates;
    const matchedStates = currentStates.filter((currentState) => {
      return obj[`${property}.${currentState}`] !== undefined;
    });
    if (matchedStates.length > 0) {
      const selectedState = matchedStates
        // longer state names take precedence because they match more. e.g. `a.b.c` > `a.b`
        .sort((a, b) => b.length - a.length)
        .find((currentState) => {
          return obj[`${property}.${currentState}`] !== undefined;
        });
      return obj[`${property}.${selectedState}`] ?? obj[property];
    } else {
      return obj[property];
    }
  }

  emitEvent(eventType: keyof On<string>, field: ControlField<any, string> | ButtonField<string>) {
    const currentStates = this.store.getState().currentStates;
    const matchedStates = currentStates.filter((currentState) => {
      return field.on?.[`${eventType}.${currentState}`] !== undefined;
    });

    // More than one event can be emitted if more than one currentstate matches
    if (matchedStates.length > 0) {
      matchedStates.forEach((currentState) => {
        const eventName: EventName | undefined = field.on?.[`${eventType}.${currentState}`];
        if (eventName) {
          this.events$.next({
            name: eventName,
            data: this.store.getState().data,
            callback: (action: EventHandlerCallback) => {
              this.store.dispatch(action);
            },
          });
        }
      });
    } else {
      const eventName: EventName | undefined = field.on?.[eventType];
      if (eventName) {
        this.events$.next({
          name: eventName,
          data: this.store.getState().data,
          callback: (action: EventHandlerCallback) => {
            this.store.dispatch(action);
          },
        });
      }
    }
  }
}
