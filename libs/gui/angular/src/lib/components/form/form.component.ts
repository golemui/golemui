import { CommonModule } from '@angular/common';
import { Component, computed, input, output, Type } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { Dependencies } from '@golemui/gui-shared';
import { CustomValidatorSchemas, initValidators } from '@golemui/gui-validators';
import { widgetLoaders } from '../../widget.loaders';

@Component({
  imports: [CommonModule, Angular.FormCoreComponent],
  selector: 'gui-form',
  templateUrl: './form.component.html',
})
export class FormComponent {
  formDef = input.required<string | Record<string, any>>();
  customWidgetLoaders = input.required<Core.WidgetLoaders<Type<Core.WithWidget>>>({});
  data = input<Record<string, any>>({});
  meta = input<Record<string, any>>({});
  middlewares = input<Core.Middleware<Core.State, Core.Action>[]>([]);
  customValidators = input<CustomValidatorSchemas>({});
  validateOn = input<Core.ValidateOn>('eager');
  itemRenderers = input<Record<string, Angular.AngularItemRenderer<any>>>({});
  localization = input<Core.I18nTranslator>();
  dependencies = input<Dependencies>({});
  autocomplete = input<string | undefined>(undefined);

  protected allWidgetLoaders = computed(() => ({
    ...widgetLoaders,
    ...this.customWidgetLoaders(),
  }));
  protected allValidators = computed(() => initValidators({ ...this.customValidators() }));

  formHealth = output<Core.FormHealth>();
  formEvent = output<Core.FormEvent>();
}
