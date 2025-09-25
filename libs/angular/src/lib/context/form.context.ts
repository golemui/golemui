import { Injectable } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject } from 'rxjs';
import { FieldLoaders, FieldRegistry } from './field.registry';

@Injectable()
export class FormContext {
  fieldRegistry = new FieldRegistry();
  store: Core.FormStore = {} as Core.FormStore;
  events$ = new Subject<Core.FormEvent>();

  initialize(
    fieldLoaders: FieldLoaders,
    middlewares: Core.Middleware<Core.State, Core.Action>[] = [],
  ) {
    this.fieldRegistry.setFieldLoaders(fieldLoaders);
    this.store = Core.createFormStore(middlewares);
  }

  // FIXME: Not type safety
  getPropertyValueByCurrentState<T>(
    property: string,
    obj: Record<string, any>,
  ): T | undefined {
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

  emitEvent(
    eventType: keyof Core.On<string>,
    field: Core.ControlField<any, string> | Core.ButtonField<string>,
  ) {
    const currentStates = this.store.getState().currentStates;
    const matchedStates = currentStates.filter((currentState) => {
      return field.on?.[`${eventType}.${currentState}`] !== undefined;
    });

    // More than one event can be emitted if more than one currentstate matches
    if (matchedStates.length > 0) {
      matchedStates.forEach((currentState) => {
        const eventName: Core.EventName | undefined =
          field.on?.[`${eventType}.${currentState}`];
        if (eventName) {
          this.events$.next({
            name: eventName,
            data: this.store.getState().data,
          });
        }
      });
    } else {
      const eventName: Core.EventName | undefined = field.on?.[eventType];
      if (eventName) {
        this.events$.next({
          name: eventName,
          data: this.store.getState().data,
        });
      }
    }
  }
}
