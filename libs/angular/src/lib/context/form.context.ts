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

  emitEvent(eventName: Core.EventName | undefined) {
    if (eventName) {
      this.events$.next({ name: eventName, data: this.store.getState().data });
    }
  }
}
