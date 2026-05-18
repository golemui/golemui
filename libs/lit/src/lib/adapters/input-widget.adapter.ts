import { type ControlTemplateData, type InputWidget, type ItemRenderItemData, dataByPath$, injectedValidationByPath$, touchedControlsByPath$, validationByPath$ } from '@golemui/core'
import { createContext } from '@lit/context';
import { combineLatest, takeUntil } from 'rxjs';
import { type LitItemRenderer } from '../components/item-renderers/item-renderer';
import { BaseWidgetAdapter } from './base-widget.adapter';

export const inputContext = createContext<InputWidgetAdapter<any, any>>('guiInputWidgetAdapter');

export class InputWidgetAdapter<
  T,
  ExtraProps extends Record<string, any>,
> extends BaseWidgetAdapter<InputWidget<T>> {
  override templateData = {} as ControlTemplateData<T> & ExtraProps;

  init(widget: InputWidget<T>) {
    this.widget = widget;

    this.addWidgetToTheStore(widget);
    this.templateDataUpdater();

    // Set widget data
    this.context.store.dispatch({
      type: 'SET_WIDGET_INITIAL_DATA',
      payload: { data: widget.defaultValue, path: widget.path },
    });

    // Set the initial templateData, including the control's data value
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), dataByPath$(widget.path))
      .subscribe((data) => this.setTemplateData({ value: data }));

    // Listen to the validation stream for this control
    const validation$ = this.context.store.state$.pipe(
      takeUntil(this.destroy$),
      validationByPath$(widget.path),
    );
    const injectedValidation$ = this.context.store.state$.pipe(
      takeUntil(this.destroy$),
      injectedValidationByPath$(widget.path),
    );

    combineLatest([validation$, injectedValidation$]).subscribe(
      ([validation, injectedValidation]) => {
        this.setTemplateData({
          errors: [...(validation ?? []), ...(injectedValidation ?? [])],
        });
      },
    );

    // Listen to the touchedControls stream for this control
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), touchedControlsByPath$(widget.path))
      .subscribe((touched) => this.setTemplateData({ touched }));

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
  getItemRenderer<T extends ItemRenderItemData>(
    itemRendererKey: string | undefined,
    defaultItemRenderer: LitItemRenderer<T>,
  ): LitItemRenderer<T> {
    if (!itemRendererKey) {
      return defaultItemRenderer;
    }
    const itemRenderers = this.context.itemRenderers as Record<string, LitItemRenderer<T>>;
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
