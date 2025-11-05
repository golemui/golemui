import * as Core from '@formforge/core';
import { BaseAdapter } from './base.adapter';
import { takeUntil } from 'rxjs';
import { createContext } from '@lit/context';

export const buttonContext = createContext<ButtonAdapter>('ffButtonAdapter');

export class ButtonAdapter extends BaseAdapter<Core.ButtonField> {
  override templateData: { label?: string; disabled?: boolean } = {};

  init(field: Core.ButtonField) {
    this.field = field;
    this.setTemplateData({
      label: this.field.label,
    });

    this.addFieldToTheStore(field);
    this.propsUpdaterByCurrentState(this.templateData);

    // Listen to the fieldFlags stream (`disabled` flag)
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.setTemplateData({
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        });
      });

    // Listen to the form states stream and keep the `label` property in sync with the current state
    this.context.store.state$.pipe(takeUntil(this.destroy$), Core.currentStates).subscribe(() => {
      this.setTemplateData({
        label: this.context.getPropertyValueByCurrentState('label', this.field),
      });
    });

    this.context.emitEvent('load', this.field);
  }

  click() {
    this.context.emitEvent('click', this.field);
  }
}
