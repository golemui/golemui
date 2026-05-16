import { CommonModule } from '@angular/common';
import { Component, computed, input, output, Type, viewChild } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { FormInitConfig } from '@golemui/core';
import { GuiFormInitConfig, resolveFormInput } from '@golemui/gui-shared';
import { initValidators } from '@golemui/gui-validators';
import { widgetLoaders } from '../../widget.loaders';

@Component({
  imports: [CommonModule, Angular.FormCoreComponent],
  selector: 'gui-form',
  templateUrl: './form.component.html',
})
export class FormComponent {
  config = input.required<GuiFormInitConfig>();
  autocomplete = input<string | undefined>(undefined);

  private coreForm = viewChild(Angular.FormCoreComponent);

  protected resolved = computed(() =>
    resolveFormInput(this.config().formDef, this.config().formSelectors, this.config().formConfig),
  );

  protected coreConfig = computed((): FormInitConfig<Type<Core.WithWidget>> => {
    const c = this.config();
    const r = this.resolved();
    return {
      formDef: r.formDef as string | Record<string, any>,
      widgetLoaders: {
        ...widgetLoaders,
        ...((r.widgetLoaders ?? {}) as Core.WidgetLoaders<Type<Core.WithWidget>>),
        ...((c.customWidgetLoaders ?? {}) as Core.WidgetLoaders<Type<Core.WithWidget>>),
      },
      dependencies: { ...(r.dependencies ?? {}), ...(c.dependencies ?? {}) },
      validateOn: c.validateOn ?? r.validateOn ?? 'eager',
      itemRenderers: {
        ...((r.itemRenderers ?? {}) as Record<string, Angular.AngularItemRenderer<any>>),
        ...((c.itemRenderers ?? {}) as Record<string, Angular.AngularItemRenderer<any>>),
      },
      localization: c.localization,
      middlewares: c.middlewares ?? [],
      data: c.data,
      meta: c.meta,
      formName: c.formName,
    };
  });

  protected allValidators = computed(() =>
    initValidators({ ...(this.config().customValidators ?? {}) }),
  );

  formHealth = output<Core.FormHealth>();
  formEvent = output<Core.FormEvent>();

  protected onCoreFormEvent(event: Core.FormEvent): void {
    this.resolved().formEvent?.(event);
    this.formEvent.emit(event);
  }

  setData(data: Record<string, any>): void {
    this.coreForm()?.setData(data);
  }

  setMeta(meta: Record<string, any>): void {
    this.coreForm()?.setMeta(meta);
  }
}
