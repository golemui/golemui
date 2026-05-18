import { Injectable, signal } from '@angular/core';
import type { ActionWidget, ActionWidgetTemplateData } from '@golemui/core';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class ActionWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<ActionWidget> {
  templateData = signal<ActionWidgetTemplateData & ExtraProps>(
    {} as ActionWidgetTemplateData & ExtraProps,
  );

  init(widget: ActionWidget) {
    this.widget = widget;
    this.templateData.update((current) => ({
      ...current,
      label: this.widget.label as string,
    }));

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater(this.templateData);

    this.context.emitEvent('load', this.widget);
  }

  click() {
    this.context.emitEvent('click', this.widget);
  }
}
