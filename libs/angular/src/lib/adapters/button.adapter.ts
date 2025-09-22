import { inject, Injectable } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject } from 'rxjs';
import { FormContext } from '../context/form.context';

@Injectable()
export class ButtonAdapter {
  private context = inject(FormContext);
  private destroy$ = new Subject<void>();
  private field!: Core.ButtonField;

  templateData: { label?: string } = {};

  init(field: Core.ButtonField) {
    this.field = field;
    this.templateData.label = this.field.label;
    this.context.emitEvent(this.field.on?.load);
  }

  click() {
    this.context.emitEvent(this.field.on?.click);
  }

  destroy() {
    this.destroy$.next();
  }
}
