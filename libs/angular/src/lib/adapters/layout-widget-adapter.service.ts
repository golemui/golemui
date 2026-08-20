import { Injectable, signal } from '@angular/core';
import { type FormWidget, type LayoutTemplateData, type LayoutWidget } from '@golemui/core';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class LayoutWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<LayoutWidget> {
  templateData = signal<LayoutTemplateData & ExtraProps>({
    children: [] as FormWidget<string>[],
  } as LayoutTemplateData & ExtraProps);

  init(widget: LayoutWidget) {
    this.widget = widget;

    // Set initial templateData
    this.templateData.update((current) => ({
      ...current,
      ...this.widget.props,
    }));

    this.templateDataUpdater(this.templateData, (viewModel) =>
      // Keep the last children while hidden, an empty flash would be visible otherwise.
      viewModel.widget !== undefined ? { children: viewModel.children } : {},
    );
  }

  change<T>(detail?: T) {
    this.context.emitEvent('change', this.widget, detail);
  }
}
