import { Injectable, type Type } from '@angular/core';
import * as Core from '@golemui/core';

@Injectable()
export class AngularFormContext<T extends Type<Core.WithWidget>> extends Core.FormContext<T> {
  // Just a subclass to make Core.FormContext Injectable
}
