import { Injectable, signal } from '@angular/core';
import * as Core from '@golemui/core';
import { combineLatest, takeUntil } from 'rxjs';
import { AngularItemRenderer } from '../components/item-renderers/item-renderer';
import { BaseFieldAdapter } from './base.field-adapter';

@Injectable()
export class ControlFieldAdapter<
  T,
  ExtraProps extends Record<string, any>,
> extends BaseFieldAdapter<Core.ControlField<T>> {
  templateData = signal<Core.ControlTemplateData<T> & ExtraProps>(
    {} as Core.ControlTemplateData<T> & ExtraProps,
  );

  init(field: Core.ControlField<T>) {
    this.field = field;

    this.addFieldToTheStore(field);
    this.templateDataUpdater(this.templateData);

    // Set field data
    this.context.store.dispatch({
      type: 'SET_FIELD_INITIAL_DATA',
      payload: { data: field.defaultValue, path: field.path },
    });

    // Set the initial templateData, including the controls's data value
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.dataByPath$<T>(field.path))
      .subscribe((data) => this.templateData.update((current) => ({ ...current, value: data })));

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
        this.templateData.update((current) => ({
          ...current,
          errors: [...(validation ?? []), ...(injectedValidation ?? [])],
        }));
      },
    );

    // Listen to the touchedControls stream for this control
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.touchedControlsByPath$(field.path))
      .subscribe((touched) => {
        this.templateData.update((current) => ({
          ...current,
          touched,
        }));
      });

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
      payload: { reason: 'blur', path: this.field.path },
    });
  }
}
