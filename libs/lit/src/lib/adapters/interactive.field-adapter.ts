import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

export const interactiveContext = createContext<InteractiveFieldAdapter>(
  'ffInteractiveFieldAdapter',
);

export class InteractiveFieldAdapter extends BaseFieldAdapter<Core.InteractiveField> {
  override templateData: { label?: string; disabled?: boolean } = {};

  init(field: Core.InteractiveField) {
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
    this.context.store.dispatch({ type: 'TOUCHED' });
    this.context.emitEvent('click', this.field);
  }
}
