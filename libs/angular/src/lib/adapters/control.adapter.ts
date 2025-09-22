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

    this.templateData.label =
      this.field.label === undefined
        ? Core.toLabel(field.path)
        : this.field.label === ''
          ? undefined
          : this.field.label;

    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      payload: { data: field.defaultValue, path: field.path },
    });

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$<T>(field.path))
      .subscribe((value) => (this.templateData.value = value));

    this.context.emitEvent(this.field.on?.load);
  }

  valueChanged<T>(value: T) {
    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      payload: { path: this.field.path, data: value },
    });
    this.context.emitEvent(this.field.on?.change);
  }

  destroy() {
    this.destroy$.next();
  }
}
