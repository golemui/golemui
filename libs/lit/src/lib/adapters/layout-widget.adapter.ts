import {
  type LayoutTemplateData,
  type LayoutWidget,
  calculatedLayoutChildrenByUid$,
} from '@golemui/core';
import { createContext } from '@lit/context';
import { takeUntil } from 'rxjs';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const layoutContext = createContext<LayoutWidgetAdapter<any>>('guiLayoutWidgetAdapter');

export class LayoutWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<LayoutWidget> {
  override templateData = {} as LayoutTemplateData & ExtraProps;

  init(widget: LayoutWidget) {
    this.widget = widget;

    // Set initial templateData
    this.setTemplateData({
      ...this.widget.props,
    });

    // Listen to the layout's `hidden`-flag-filtered children stream
    this.context.store.state$
      .pipe(calculatedLayoutChildrenByUid$(this.widget.uid))
      .pipe(takeUntil(this.destroy$))
      .subscribe((children) => {
        this.setTemplateData({
          children,
        });
      });

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater();
  }

  change<T>(detail?: T) {
    this.context.emitEvent('change', this.widget, detail);
  }
}
