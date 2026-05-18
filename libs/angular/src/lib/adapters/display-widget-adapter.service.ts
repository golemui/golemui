import { Injectable, signal } from '@angular/core';
import type { DisplayWidget, DisplayWidgetTemplateData } from '@golemui/core';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class DisplayWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<DisplayWidget> {
  templateData = signal<DisplayWidgetTemplateData & ExtraProps>(
    {} as DisplayWidgetTemplateData & ExtraProps,
  );

  init(widget: DisplayWidget) {
    this.widget = widget;

    // Set initial templateData
    this.templateData.update((current) => ({
      ...current,
      ...this.widget.props,
    }));

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater(this.templateData);
  }
}
