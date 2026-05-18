import type { DisplayWidget, DisplayWidgetTemplateData } from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const displayWidgetContext =
  createContext<DisplayWidgetAdapter<any>>('guiDisplayWidgetAdapter');

export class DisplayWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<DisplayWidget> {
  override templateData = {} as DisplayWidgetTemplateData & ExtraProps;

  init(widget: DisplayWidget) {
    this.widget = widget;

    // Set initial templateData
    this.setTemplateData({
      ...this.widget.props,
    });

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater();
  }
}
