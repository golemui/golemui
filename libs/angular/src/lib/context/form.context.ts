import { Injectable, type Type } from '@angular/core';
import { FormContext, type WithWidget } from '@golemui/core';

@Injectable()
export class AngularFormContext<T extends Type<WithWidget>> extends FormContext<T> {
  // Just a subclass to make Core.FormContext Injectable
}
