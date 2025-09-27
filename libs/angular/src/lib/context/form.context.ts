import { Injectable } from '@angular/core';
import * as Core from '@formforge/core';

@Injectable()
export class AngularFormContext extends Core.FormContext {
  // Just a subclass to make Core.FormContext Injectable
}
