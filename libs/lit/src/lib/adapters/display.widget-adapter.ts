import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const displayWidgetContext =
  createContext<DisplayWidgetAdapter<any>>('guiDisplayWidgetAdapter');

export class DisplayWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<Core.DisplayWidget> {
  override templateData = {} as Core.DisplayWidgetTemplateData & ExtraProps;

  init(widget: Core.DisplayWidget) {
    this.widget = widget;

    // Set initial templateData
    this.setTemplateData({
      ...this.widget.props,
    });

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater();
  }
}
