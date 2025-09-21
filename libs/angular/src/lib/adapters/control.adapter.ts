import { inject, Injectable } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject, takeUntil } from 'rxjs';
import { FormContext } from '../context/form.context';

@Injectable()
export class ControlAdapter<T> {
  private context = inject(FormContext);
  private destroy$ = new Subject<void>();
  private field!: Core.ControlField<T>;

  templateData: { label?: string; value?: T } = {};

  init(field: Core.ControlField<T>) {
    this.field = field;

    this.templateData.label = this.field.label;

    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      payload: { data: field.defaultValue, path: field.path },
    });

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$<T>(field.path))
      .subscribe((value) => (this.templateData.value = value));
  }

  destroy() {
    this.destroy$.next();
  }
}
