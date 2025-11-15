import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

export const controlContext = createContext<ControlFieldAdapter<any, any>>('ffControlFieldAdapter');

export class ControlFieldAdapter<
  T,
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.ControlField<T>> {
  override templateData = {} as Core.ControlTemplateData<T> & ExtraProps;

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
    this.setTemplateData({
      label: this.calculateLabel(),
      ...this.field.props,
    });

    // Set the initial templateData, including the control's data value
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$(field.path))
      .subscribe((data) => this.setTemplateData({ value: data }));

    // Listen to the validation stream for this control
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.validationByPath$(field.path))
      .subscribe((validation) => {
        this.setTemplateData({
          errors: validation?.status?.errors || [],
        });
      });

    // Listen to the touchedControls stream for this control
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.touchedControlsByPath$(field.path))
      .subscribe((touched) => this.setTemplateData({ touched }));

    // Listen to the fieldFlags stream (`disabled`, `required` and `readonly` flags)
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.setTemplateData({
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
          readonly: fieldFlags?.readonly ?? (field.readonly as boolean),
        });
      });

    // Listen to the form states stream and keep the `label` property in sync with the current state
    this.context.store.state$.pipe(takeUntil(this.destroy$), Core.currentStates).subscribe(() => {
      this.setTemplateData({
        label:
          this.context.getPropertyValueByCurrentState('label', this.field) ?? this.calculateLabel(),
      });
    });

    // Listen to the form states stream and keep the `validator` property in sync with the current state
    this.context.store.state$.pipe(takeUntil(this.destroy$), Core.currentStates).subscribe(() => {
      this.setTemplateData({
        validator: this.context.getPropertyValueByCurrentState('validator', this.field),
      });
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
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: this.field.path },
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
