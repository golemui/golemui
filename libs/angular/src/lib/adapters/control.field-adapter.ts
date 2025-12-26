import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class ControlFieldAdapter<
  T,
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.ControlField<T>> {
  templateData = signal<Core.ControlTemplateData<T> & ExtraProps>(
    {} as Core.ControlTemplateData<T> & ExtraProps,
  );

  init(field: Core.ControlField<T>) {
    this.field = field;

    this.addFieldToTheStore(field);
    this.propsUpdater(this.templateData, (obj) => {
      const label =
        obj.label === undefined
          ? Core.toLabel(obj['path'])
          : obj.label === ''
            ? undefined
            : obj.label;
      obj.label = label;
      return obj;
    });

    // Set field data
    this.context.store.dispatch({
      type: 'SET_FIELD_INITIAL_DATA',
      payload: { data: field.defaultValue, path: field.path },
    });

    // Set the initial templateData, including the controls's data value
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$<T>(field.path))
      .subscribe((data) => this.templateData.update((current) => ({ ...current, value: data })));

    // Listen to the validation stream for this control
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.validationByPath$(field.path))
      .subscribe((validation) => {
        this.templateData.update((current) => ({
          ...current,
          errors: validation?.status?.errors || [],
        }));
      });

    // Listen to the touchedControls stream for this control
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.touchedControlsByPath$(field.path))
      .subscribe((touched) => {
        this.templateData.update((current) => ({
          ...current,
          touched,
        }));
      });

    this.context.emitEvent('load', this.field);
  }

  valueChanged<T>(value: T) {
    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      payload: { path: this.field.path, data: value },
    });
    this.context.emitEvent('change', this.field);
  }

  onBlur() {
    this.context.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: this.field.path },
    });
  }
}
