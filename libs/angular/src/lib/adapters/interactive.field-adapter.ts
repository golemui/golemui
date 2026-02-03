import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class InteractiveFieldAdapter extends BaseFieldAdapter<Core.ActionWidget> {
  templateData = signal<Core.ActionWidgetTemplateData>({} as Core.ActionWidgetTemplateData);

  init(field: Core.ActionWidget) {
    this.field = field;
    this.templateData.update((current) => ({
      ...current,
      label: this.field.label as string,
    }));

    this.addFieldToTheStore(field);
    this.templateDataUpdater(this.templateData);

    this.context.emitEvent('load', this.field);
  }

  click() {
    this.context.emitEvent('click', this.field);
  }
}
