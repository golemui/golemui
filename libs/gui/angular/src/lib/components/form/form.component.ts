import { CommonModule } from '@angular/common';
import { Component, computed, input, output, Type } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { vanillaSchemaToFieldMap } from '@golemui/gui-shared';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
} from '@golemui/gui-validators';
import { vanillaWidgetLoaders } from '../../widget.loaders';

@Component({
  imports: [CommonModule, Angular.FormCoreComponent],
  selector: 'gui-form',
  templateUrl: './form.component.html',
})
export class FormComponent {
  formDef = input.required<string | Record<string, any>>();
  widgetLoaders = input.required<Core.WidgetLoaders<Type<Core.WithWidget>>>({});
  data = input<Record<string, any>>({});
  middlewares = input<Core.Middleware<Core.State, Core.Action>[]>([]);
  validators = input<CustomValidatorSchemas>({});
  validateOn = input<Core.ValidateOn>('eager');
  itemRenderers = input<Record<string, Angular.AngularItemRenderer<any>>>({});
  localization = input<Core.I18nTranslator>();

  protected customWidgetLoaders = computed(() => ({
    ...vanillaWidgetLoaders,
    ...this.widgetLoaders(),
  }));
  protected customValidators = computed(() => initValidators({ ...this.validators() }));
  protected customMiddlewares = computed(() => [
    Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(jsonSchemaValidators)),
    ...this.middlewares(),
  ]);

  formHealth = output<Core.FormHealth>();
  formEvent = output<Core.FormEvent>();
}
