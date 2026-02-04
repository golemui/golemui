import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const interactiveContext = createContext<InteractiveWidgetAdapter>(
  'guiInteractiveWidgetAdapter',
);

export class InteractiveWidgetAdapter extends BaseWidgetAdapter<Core.ActionWidget> {
  override templateData = {} as Core.ActionWidgetTemplateData;

  init(widget: Core.ActionWidget) {
    this.widget = widget;
    this.setTemplateData({
      label: this.widget.label,
    });

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater();

    this.context.emitEvent('load', this.widget);
  }

  click() {
    this.context.emitEvent('click', this.widget);
  }
}
