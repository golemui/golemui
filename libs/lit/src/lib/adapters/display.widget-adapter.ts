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

    // Raw props seed: a widget hidden at init renders these until its first visible emission.
    this.setTemplateData({
      ...this.widget.props,
    });

    this.templateDataUpdater();
  }
}
