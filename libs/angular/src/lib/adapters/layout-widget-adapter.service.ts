import { Injectable, signal } from '@angular/core';
import {
  type FormWidget,
  type LayoutTemplateData,
  type LayoutWidget,
  calculatedLayoutChildrenByUid$,
} from '@golemui/core';
import { takeUntil } from 'rxjs';
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

    // Listen to the layout's `hidden`-flag-filtered children stream
    this.context.store.state$
      .pipe(calculatedLayoutChildrenByUid$(this.widget.uid))
      .pipe(takeUntil(this.destroy$))
      .subscribe((children) => {
        this.templateData.update((current) => ({
          ...current,
          children,
        }));
      });

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater(this.templateData);
  }

  change<T>(detail?: T) {
    this.context.emitEvent('change', this.widget, detail);
  }
}
