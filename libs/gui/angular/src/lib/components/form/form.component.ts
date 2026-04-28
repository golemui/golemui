import { CommonModule } from '@angular/common';
import { Component, computed, input, output, Type } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import {
  Dependencies,
  DxFormConfig,
  FormInput,
  GslSelectorsInput,
  resolveFormInput,
} from '@golemui/gui-shared';
import { CustomValidatorSchemas, initValidators } from '@golemui/gui-validators';
import { widgetLoaders } from '../../widget.loaders';

@Component({
  imports: [CommonModule, Angular.FormCoreComponent],
  selector: 'gui-form',
  templateUrl: './form.component.html',
})
export class FormComponent {
  formDef = input.required<FormInput>();
  formSelectors = input<GslSelectorsInput | undefined>(undefined);
  formConfig = input<DxFormConfig | undefined>(undefined);
  customWidgetLoaders = input<Core.WidgetLoaders<Type<Core.WithWidget>>>({});
  data = input<Record<string, any>>({});
  meta = input<Record<string, any>>({});
  middlewares = input<Core.Middleware<Core.State, Core.Action>[]>([]);
  customValidators = input<CustomValidatorSchemas>({});
  validateOn = input<Core.ValidateOn>('eager');
  itemRenderers = input<Record<string, Angular.AngularItemRenderer<any>>>({});
  localization = input<Core.I18nTranslator>();
  dependencies = input<Dependencies>({});
  autocomplete = input<string | undefined>(undefined);

  protected resolved = computed(() =>
    resolveFormInput(this.formDef(), this.formSelectors(), this.formConfig()),
  );

  protected resolvedFormDef = computed(() => this.resolved().formDef);
  protected allWidgetLoaders = computed(() => ({
    ...widgetLoaders,
    ...((this.resolved().widgetLoaders ?? {}) as Core.WidgetLoaders<Type<Core.WithWidget>>),
    ...this.customWidgetLoaders(),
  }));
  protected allDependencies = computed(
    () => this.dependencies() ?? this.resolved().dependencies ?? {},
  );
  protected resolvedValidateOn = computed(
    () => this.validateOn() ?? this.resolved().validateOn ?? 'eager',
  );
  protected allItemRenderers = computed(() => ({
    ...((this.resolved().itemRenderers ?? {}) as Record<string, Angular.AngularItemRenderer<any>>),
    ...this.itemRenderers(),
  }));
  protected allValidators = computed(() => initValidators({ ...this.customValidators() }));

  formHealth = output<Core.FormHealth>();
  formEvent = output<Core.FormEvent>();

  protected onCoreFormEvent(event: Core.FormEvent): void {
    this.resolved().formEvent?.(event);
    this.formEvent.emit(event);
  }
}
