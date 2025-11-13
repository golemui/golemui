import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class ControlAdapter<T, ExtraProps extends Record<string, any>> extends BaseFieldAdapter<
  Core.ControlField<T>
> {
  templateData = signal<Core.ControlTemplateData<T> & ExtraProps>(
    {} as Core.ControlTemplateData<T> & ExtraProps,
  );

  init(field: Core.ControlField<T>) {
    this.field = field;

    this.addFieldToTheStore(field);
    this.propsUpdaterByCurrentState(this.templateData);

    // Set field data
    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      updateIf: (oldValue) => oldValue === undefined,
      payload: { data: field.defaultValue, path: field.path },
    });

    // Set the initial control `label` and merge `props`
    this.templateData.update((current) => ({
      ...current,
      label: this.calculateLabel(),
      ...this.field.props,
    }));

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

    // Listen to the fieldFlags stream (`disabled` and `readonly` flags)
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.templateData.update((current) => ({
          ...current,
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        }));
        this.templateData.update((current) => ({
          ...current,
          readonly: fieldFlags?.readonly ?? (field.readonly as boolean),
        }));
      });

    // Listen to the form states stream and keep the `label` property in sync with the current state
    this.context.store.state$.pipe(takeUntil(this.destroy$), Core.currentStates).subscribe(() => {
      this.templateData.update((current) => ({
        ...current,
        label:
          this.context.getPropertyValueByCurrentState('label', this.field) ?? this.calculateLabel(),
      }));
    });

    // Listen to the form states stream and keep the `validator` property in sync with the current state
    this.context.store.state$.pipe(takeUntil(this.destroy$), Core.currentStates).subscribe(() => {
      this.templateData.update((current) => ({
        ...current,
        validator: this.context.getPropertyValueByCurrentState('validator', this.field),
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

  onBlur() {
    this.context.store.dispatch({
      type: 'TOUCHED',
    });
  }

  private calculateLabel() {
    return this.field.label === undefined
      ? Core.toLabel(this.field.path)
      : this.field.label === ''
        ? undefined
        : this.field.label;
  }
}
