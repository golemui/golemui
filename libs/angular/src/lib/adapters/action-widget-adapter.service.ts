import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class ActionWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<Core.ActionWidget> {
  templateData = signal<Core.ActionWidgetTemplateData & ExtraProps>(
    {} as Core.ActionWidgetTemplateData & ExtraProps,
  );

  init(widget: Core.ActionWidget) {
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
