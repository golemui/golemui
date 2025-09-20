import { Injectable } from '@angular/core';
import * as Core from '@formforge/core';
import { FieldLoaders, FieldRegistry } from './field.registry';

@Injectable()
export class FormContext {
  fieldRegistry = new FieldRegistry();
  store: Core.FormStore = {} as Core.FormStore;

  initialize(
    fieldLoaders: FieldLoaders,
    middlewares: Core.Middleware<Core.State, Core.Action>[] = [],
  ) {
    this.fieldRegistry.setFieldLoaders(fieldLoaders);
    this.store = Core.createFormStore(middlewares);
  }
}
