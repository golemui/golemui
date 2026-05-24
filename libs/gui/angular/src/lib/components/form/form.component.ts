import { CommonModule } from '@angular/common';
import { Component, computed, input, output, type Type, viewChild } from '@angular/core';
import { type AngularItemRenderer, FormCoreComponent } from '@golemui/angular';
import type {
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  WidgetLoaders,
  WithWidget,
} from '@golemui/core';
import { type FormInitConfig } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import { widgetLoaders } from '../../widget.loaders';

@Component({
  imports: [CommonModule, FormCoreComponent],
  selector: 'gui-form',
  templateUrl: './form.component.html',
})
export class FormComponent {
  config = input.required<GuiFormInitConfig>();
  autocomplete = input<string | undefined>(undefined);

  private coreForm = viewChild(FormCoreComponent);

  protected resolved = computed(() =>
    resolveFormInput(this.config().formDef, this.config().formSelectors, this.config().formConfig),
  );

  protected coreConfig = computed((): FormInitConfig<Type<WithWidget>> => {
    const c = this.config();
    const r = this.resolved();
    return {
      formDef: r.formDef as string | Record<string, any>,
      widgetLoaders: {
        ...widgetLoaders,
        ...((r.widgetLoaders ?? {}) as WidgetLoaders<Type<WithWidget>>),
        ...((c.customWidgetLoaders ?? {}) as WidgetLoaders<Type<WithWidget>>),
      },
      dependencies: { ...(r.dependencies ?? {}), ...(c.dependencies ?? {}) },
      validateOn: c.validateOn ?? r.validateOn ?? 'eager',
      itemRenderers: {
        ...((r.itemRenderers ?? {}) as Record<string, AngularItemRenderer<any>>),
        ...((c.itemRenderers ?? {}) as Record<string, AngularItemRenderer<any>>),
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

  formHealth = output<FormHealth>();
  formEvent = output<FormEvent>();
  formSubmit = output<FormSubmitEvent>();

  protected onCoreFormEvent(event: FormEvent): void {
    this.resolved().formEvent?.(event);
    this.formEvent.emit(event);
  }

  protected onCoreFormSubmitEvent(event: FormSubmitEvent): void {
    this.formSubmit.emit(event);
  }

  setData(data: Record<string, any>): void {
    this.coreForm()?.setData(data);
  }

  setMeta(meta: Record<string, any>): void {
    this.coreForm()?.setMeta(meta);
  }
}
