import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { takeUntil } from 'rxjs';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class LayoutWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<Core.LayoutWidget> {
  templateData = signal<Core.LayoutTemplateData & ExtraProps>({
    children: [] as Core.FormWidget<string>[],
  } as Core.LayoutTemplateData & ExtraProps);

  init(widget: Core.LayoutWidget) {
    this.widget = widget;

    // Set initial templateData
    this.templateData.update((current) => ({
      ...current,
      ...this.widget.props,
    }));

    // Listen to the layout's `hidden`-flag-filtered children stream
    this.context.store.state$
      .pipe(Core.calculatedLayoutChildrenByUid$(this.widget.uid))
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
