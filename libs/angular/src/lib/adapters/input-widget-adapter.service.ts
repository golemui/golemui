import { Injectable, signal } from '@angular/core';
import { type ControlTemplateData, type InputWidget, type ItemRenderItemData } from '@golemui/core';
import { resolveItemRenderer } from '@golemui/core/internals';
import { type AngularItemRenderer } from '../components/item-renderers/item-renderer';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class InputWidgetAdapter<
  T,
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<InputWidget<T>> {
  templateData = signal<ControlTemplateData<T> & ExtraProps>(
    {} as ControlTemplateData<T> & ExtraProps,
  );

  init(widget: InputWidget<T>) {
    this.widget = widget;

    this.templateDataUpdater(this.templateData, (viewModel) => ({
      value: viewModel.value as T,
      errors: viewModel.errors,
      touched: viewModel.touched,
      // A repeater's rows only make sense while it is visible.
      ...(viewModel.widget !== undefined ? { rows: viewModel.rows } : {}),
    }));

    if (this.isBrowser) {
      this.context.emitEvent('load', this.widget);
    }
  }

  valueChanged<T>(value: T) {
    this.context.store.dispatch({
      type: 'SET_WIDGET_DATA',
      payload: { path: this.widget.path, data: value },
    });
    this.context.emitEvent('change', this.widget);
  }

  /**
   * Repeater inputs only: writes the rows after the control removed the row at `index`. The touched
   * state, errors, injected issues and prop overrides of the other rows move with their rows.
   */
  rowRemoved<T>(rows: T, index: number) {
    this.context.store.dispatch({
      type: 'SET_WIDGET_DATA',
      payload: { path: this.widget.path, data: rows, rowChange: { type: 'removed', index } },
    });
    this.context.emitEvent('change', this.widget);
  }

  filterChanged<T>(value: T) {
    this.context.emitEvent('filter', this.widget, value);
  }

  injectValidationIssues(issues: string[] | null) {
    this.context.store.dispatch({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path: this.widget.path, issues, reportedByWidget: true },
    });
  }

  /**
   * The item renderer the form registers under `itemRendererKey`, or `defaultItemRenderer` when
   * there is none under that name. A missing one warns once in dev mode.
   */
  getItemRenderer<T extends ItemRenderItemData>(
    itemRendererKey: string | undefined,
    defaultItemRenderer: AngularItemRenderer<T>,
  ): AngularItemRenderer<T> {
    return resolveItemRenderer(
      this.context.itemRenderers as Record<string, AngularItemRenderer<T>> | undefined,
      itemRendererKey,
      defaultItemRenderer,
    );
  }

  onBlur() {
    this.context.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: this.widget.path, uid: this.widget.uid },
    });
    this.context.emitEvent('blur', this.widget);
  }
}
