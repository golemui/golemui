import { inject, Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

@Injectable()
export class ControlAdapter<T> {
  private context = inject(AngularFormContext);
  private destroy$ = new Subject<void>();
  private field!: Core.ControlField<T>;

  templateData = signal<{
    label?: string;
    value?: T;
    disabled?: boolean;
    required?: boolean;
  }>({});

  init(field: Core.ControlField<T>) {
    this.field = field;

    this.context.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });

    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      updateIf: (oldValue) => oldValue === undefined,
      payload: { data: field.defaultValue, path: field.path },
    });

    this.templateData.update((value) => ({
      ...value,
      label: this.calculateLabel(),
    }));

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$<T>(field.path))
      .subscribe((data) =>
        this.templateData.update((value) => ({ ...value, value: data })),
      );

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.templateData.update((value) => ({
          ...value,
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        }));
        this.templateData.update((value) => ({
          ...value,
          required: fieldFlags?.required ?? (field.required as boolean),
        }));
      });

    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.currentStates)
      .subscribe(() => {
        this.templateData.update((value) => ({
          ...value,
          label:
            this.context.getPropertyValueByCurrentState('label', this.field) ??
            this.calculateLabel(),
        }));
      });

    this.context.emitEvent('load', this.field);
  }

  valueChanged<T>(value: T) {
    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      updateIf: () => true,
      payload: { path: this.field.path, data: value },
    });
    this.context.emitEvent('change', this.field);
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_FIELD',
      payload: { uid: this.field.uid },
    });
    this.destroy$.next();
  }

  private calculateLabel() {
    return this.field.label === undefined
      ? Core.toLabel(this.field.path)
      : this.field.label === ''
        ? undefined
        : this.field.label;
  }
}
