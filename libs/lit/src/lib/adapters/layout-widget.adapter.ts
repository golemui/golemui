import { type LayoutTemplateData, type LayoutWidget } from '@golemui/core';
import { createContext } from '@lit/context';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const layoutContext = createContext<LayoutWidgetAdapter<any>>('guiLayoutWidgetAdapter');

export class LayoutWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<LayoutWidget> {
  override templateData = {} as LayoutTemplateData & ExtraProps;

  init(widget: LayoutWidget) {
    this.widget = widget;

    // Raw props seed: a widget hidden at init renders these until its first visible emission.
    this.setTemplateData({
      ...this.widget.props,
    });

    this.templateDataUpdater((viewModel) =>
      // A hidden widget's view model has empty children, keep the last visible ones.
      viewModel.widget !== undefined ? { children: viewModel.children } : {},
    );
  }

  change<T>(detail?: T) {
    this.context.emitEvent('change', this.widget, detail);
  }
}
