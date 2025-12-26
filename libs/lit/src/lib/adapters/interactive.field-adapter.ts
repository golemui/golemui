import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';

export const interactiveContext = createContext<InteractiveFieldAdapter>(
  'guiInteractiveFieldAdapter',
);

export class InteractiveFieldAdapter extends BaseFieldAdapter<Core.InteractiveField> {
  override templateData: { label?: string; disabled?: boolean } = {};

  init(field: Core.InteractiveField) {
    this.field = field;
    this.setTemplateData({
      label: this.field.label,
    });

    this.addFieldToTheStore(field);
    this.templateDataUpdater();

    // Listen to the fieldFlags stream (`disabled` flag)
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        this.setTemplateData({
          disabled: fieldFlags?.disabled ?? (field.disabled as boolean),
        });
      });

    this.context.emitEvent('load', this.field);
  }

  click() {
    this.context.emitEvent('click', this.field);
  }
}
