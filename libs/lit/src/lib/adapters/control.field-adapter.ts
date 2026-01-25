import * as Core from '@golemui/core';
import { createContext } from '@lit/context';
import { combineLatest, takeUntil } from 'rxjs';
import { BaseFieldAdapter } from './base.field-adapter';
import { LitItemRenderer } from '../components/item-renderers/item-renderer';

export const controlContext =
  createContext<ControlFieldAdapter<any, any>>('guiControlFieldAdapter');

export class ControlFieldAdapter<
  T,
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.ControlField<T>> {
  override templateData = {} as Core.ControlTemplateData<T> & ExtraProps;

  init(field: Core.ControlField<T>) {
    this.field = field;

    this.addFieldToTheStore(field);
    this.templateDataUpdater();

    // Set field data
    this.context.store.dispatch({
      type: 'SET_FIELD_INITIAL_DATA',
      payload: { data: field.defaultValue, path: field.path },
    });

    // Set the initial templateData, including the control's data value
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$(field.path))
      .subscribe((data) => this.setTemplateData({ value: data }));

    // Listen to the validation stream for this control
    const validation$ = this.context.store.state$.pipe(
      takeUntil(this.destroy$),
      Core.validationByPath$(field.path),
    );
    const injectedValidation$ = this.context.store.state$.pipe(
      takeUntil(this.destroy$),
      Core.injectedValidationByPath$(field.path),
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
      .pipe(takeUntil(this.destroy$), Core.touchedControlsByPath$(field.path))
      .subscribe((touched) => this.setTemplateData({ touched }));

    this.context.emitEvent('load', this.field);
  }

  valueChanged<T>(value: T) {
    this.context.store.dispatch({
      type: 'SET_FIELD_DATA',
      payload: { path: this.field.path, data: value },
    });
    this.context.emitEvent('change', this.field);
  }

  filterChanged<T>(value: T) {
    this.context.emitEvent('filter', this.field, value);
  }

  injectValidationIssues(issues: string[] | null) {
    this.context.store.dispatch({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path: this.field.path, issues },
    });
  }

  /**
   * This is a helper to get the item renderer from the context
   */
  getItemRenderer<T extends Core.ItemRenderItemData>(
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
      payload: { reason: 'blur', path: this.field.path },
    });
  }
}
