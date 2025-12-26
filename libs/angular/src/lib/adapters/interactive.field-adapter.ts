import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class InteractiveFieldAdapter extends BaseFieldAdapter<Core.InteractiveField> {
  templateData = signal<{ label?: string; disabled?: boolean }>({});

  init(field: Core.InteractiveField) {
    this.field = field;
    this.templateData.update((current) => ({
      ...current,
      label: this.field.label as string,
    }));

    this.addFieldToTheStore(field);
    this.templateDataUpdater(this.templateData);

    // Listen to the fieldFlags stream (`disabled` flag)
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.templateData.update((current) => ({
          ...current,
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        }));
      });

    this.context.emitEvent('load', this.field);
  }

  click() {
    this.context.emitEvent('click', this.field);
  }
}
