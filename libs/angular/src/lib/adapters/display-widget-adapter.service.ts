import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class DisplayWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<Core.DisplayWidget> {
  templateData = signal<Core.DisplayWidgetTemplateData & ExtraProps>(
    {} as Core.DisplayWidgetTemplateData & ExtraProps,
  );

  init(widget: Core.DisplayWidget) {
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
