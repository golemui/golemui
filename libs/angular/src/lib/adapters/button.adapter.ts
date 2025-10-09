import { Injectable, signal } from '@angular/core';
import * as Core from '@formforge/core';
import { takeUntil } from 'rxjs';
import { BaseAdapter } from './base.adapter';

@Injectable()
export class ButtonAdapter extends BaseAdapter<Core.ButtonField> {
  templateData = signal<{ label?: string; disabled?: boolean }>({});

  init(field: Core.ButtonField) {
    this.field = field;
    this.templateData.update((current) => ({
      ...current,
      label: this.field.label,
    }));

    this.addFieldToTheStore(field);

    // Listen to the fieldFlags stream (`disabled` flag)
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.templateData.update((current) => ({
          ...current,
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        }));
      });

    // Listen to the form states stream and keep the `label` property in sync with the current state
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.currentStates)
      .subscribe(() => {
        this.templateData.update((current) => ({
          ...current,
          label: this.context.getPropertyValueByCurrentState(
            'label',
            this.field,
          ),
        }));
      });

    this.context.emitEvent('load', this.field);
  }

  click() {
    this.context.emitEvent('click', this.field);
  }
}
