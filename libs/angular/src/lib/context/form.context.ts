import { Injectable, Type } from '@angular/core';
import * as Core from '@formforge/core';

@Injectable()
export class AngularFormContext<T extends Type<Core.WithField>> extends Core.FormContext<T> {
  // Just a subclass to make Core.FormContext Injectable
}
