import * as Core from '@formforge/core';
import { createContext } from '@lit/context';
import { takeUntil } from 'rxjs';
import { BaseAdapter } from './base.adapter';
import { ControlTemplateData } from '@formforge/shared';

export const controlContext = createContext<ControlAdapter<any, any>>('ffControlAdapter');

export class ControlAdapter<T, ExtraProps extends Record<string, any>> extends BaseAdapter<
  Core.ControlField<T>
> {
  templateData = {} as ControlTemplateData<T> & ExtraProps;

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
    this.templateData = {
      ...this.templateData,
      label: this.calculateLabel(),
      ...this.field.props,
    };

    // Set the initial templateData, including the controls's data value
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$(field.path))
      .subscribe((data) => (this.templateData = { ...this.templateData, value: data }));

    // Listen to the fieldFlags stream (`disabled`, `required` and `readonly` flags)
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.templateData = {
          ...this.templateData,
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        };
        this.templateData = {
          ...this.templateData,
          required: fieldFlags?.required ?? (field.required as boolean),
        };
        this.templateData = {
          ...this.templateData,
          required: fieldFlags?.readonly ?? (field.readonly as boolean),
        };
      });

    // Listen to the form states stream and keep the `label` property in sync with the current state
    this.context.store.state$.pipe(takeUntil(this.destroy$), Core.currentStates).subscribe(() => {
      this.templateData = {
        ...this.templateData,
        label:
          this.context.getPropertyValueByCurrentState('label', this.field) ?? this.calculateLabel(),
      };
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

  private calculateLabel() {
    return this.field.label === undefined
      ? Core.toLabel(this.field.path)
      : this.field.label === ''
        ? undefined
        : this.field.label;
  }
}
