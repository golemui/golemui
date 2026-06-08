import type { ActionWidget, ActionWidgetTemplateData } from '@golemui/core';
import { createContext } from '@lit/context';
import { distinctUntilChanged, map, takeUntil } from 'rxjs';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const actionContext = createContext<ActionWidgetAdapter<any>>('guiActionWidgetAdapter');

export class ActionWidgetAdapter<
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<ActionWidget> {
  override templateData = {} as ActionWidgetTemplateData & ExtraProps;

  init(widget: ActionWidget) {
    this.widget = widget;
    this.setTemplateData({
      label: this.widget.label,
      icon: (this.widget.props as any)?.icon,
      iconPosition: (this.widget.props as any)?.iconPosition,
    });

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater();

    this.context.store.state$
      .pipe(
        takeUntil(this.destroy$),
        map((state) => state.touched && !state.isFormValid),
        distinctUntilChanged(),
      )
      .subscribe((invalid) => {
        this.setTemplateData({ invalid });
      });

    this.context.emitEvent('load', this.widget);
  }

  click() {
    this.context.emitEvent('click', this.widget);
  }
}
