import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseFieldAdapter } from './base.field-adapter';

export const interactiveContext = createContext<InteractiveFieldAdapter>(
  'guiInteractiveFieldAdapter',
);

export class InteractiveFieldAdapter extends BaseFieldAdapter<Core.ActionWidget> {
  override templateData = {} as Core.ActionWidgetTemplateData;

  init(field: Core.ActionWidget) {
    this.field = field;
    this.setTemplateData({
      label: this.field.label,
    });

    this.addFieldToTheStore(field);
    this.templateDataUpdater();

    this.context.emitEvent('load', this.field);
  }

  click() {
    this.context.emitEvent('click', this.field);
  }
}
