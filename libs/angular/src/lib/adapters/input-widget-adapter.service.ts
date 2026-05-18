import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { combineLatest, takeUntil } from 'rxjs';
import { type AngularItemRenderer } from '../components/item-renderers/item-renderer';
import { BaseWidgetAdapter } from './base-widget.adapter';

@Injectable()
export class InputWidgetAdapter<
  T,
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<Core.InputWidget<T>> {
  templateData = signal<Core.ControlTemplateData<T> & ExtraProps>(
    {} as Core.ControlTemplateData<T> & ExtraProps,
  );

  init(widget: Core.InputWidget<T>) {
    this.widget = widget;

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater(this.templateData);

    // Set widget data
    this.context.store.dispatch({
      type: 'SET_WIDGET_INITIAL_DATA',
      payload: { data: widget.defaultValue, path: widget.path },
    });

    // Set the initial templateData, including the controls's data value
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$<T>(widget.path))
      .subscribe((data) => this.templateData.update((current) => ({ ...current, value: data })));

    // Listen to the validation stream for this control
    const validation$ = this.context.store.state$.pipe(
      takeUntil(this.destroy$),
      Core.validationByPath$(widget.path),
    );
    const injectedValidation$ = this.context.store.state$.pipe(
      takeUntil(this.destroy$),
      Core.injectedValidationByPath$(widget.path),
    );

    combineLatest([validation$, injectedValidation$]).subscribe(
      ([validation, injectedValidation]) => {
        this.templateData.update((current) => ({
          ...current,
          errors: [...(validation ?? []), ...(injectedValidation ?? [])],
        }));
      },
    );

    // Listen to the touchedControls stream for this control
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.touchedControlsByPath$(widget.path))
      .subscribe((touched) => {
        this.templateData.update((current) => ({
          ...current,
          touched,
        }));
      });

    this.context.emitEvent('load', this.widget);
  }

  valueChanged<T>(value: T) {
    this.context.store.dispatch({
      type: 'SET_WIDGET_DATA',
      payload: { path: this.widget.path, data: value },
    });
    this.context.emitEvent('change', this.widget);
  }

  filterChanged<T>(value: T) {
    this.context.emitEvent('filter', this.widget, value);
  }

  injectValidationIssues(issues: string[] | null) {
    this.context.store.dispatch({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path: this.widget.path, issues },
    });
  }

  /**
   * This is a helper to get the item renderer from the context
   */
  getItemRenderer<T extends Core.ItemRenderItemData>(
    itemRendererKey: string | undefined,
    defaultItemRenderer: AngularItemRenderer<T>,
  ): AngularItemRenderer<T> {
    if (!itemRendererKey) {
      return defaultItemRenderer;
    }
    const itemRenderers = this.context.itemRenderers as Record<string, AngularItemRenderer<T>>;
    return itemRenderers[itemRendererKey];
  }

  onBlur() {
    this.context.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: this.widget.path, uid: this.widget.uid },
    });
    this.context.emitEvent('blur', this.widget);
  }
}
