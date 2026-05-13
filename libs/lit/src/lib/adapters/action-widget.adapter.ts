import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const actionContext = createContext<ActionWidgetAdapter<any>>('guiActionWidgetAdapter');

export class ActionWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<Core.ActionWidget> {
  override templateData = {} as Core.ActionWidgetTemplateData & ExtraProps;

  init(widget: Core.ActionWidget) {
    this.widget = widget;
    this.setTemplateData({
      label: this.widget.label,
      icon: (this.widget.props as any)?.icon,
      iconPosition: (this.widget.props as any)?.iconPosition,
    });

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater();

    this.context.emitEvent('load', this.widget);
  }

  click() {
    this.context.emitEvent('click', this.widget);
  }
}
