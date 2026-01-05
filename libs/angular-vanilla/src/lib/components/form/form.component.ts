import { CommonModule } from '@angular/common';
import { Component, computed, input, output, Type } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
} from '@golemui/validators-vanilla';
import { vanillaFieldLoaders } from '../../field.loaders';

@Component({
  imports: [CommonModule, Angular.FormCoreComponent],
  selector: 'gui-form',
  templateUrl: './form.component.html',
})
export class FormComponent {
  formDef = input.required<string | Record<string, any>>();
  data = input<Record<string, any>>({});
  fieldLoaders = input<Core.FieldLoaders<Type<Core.WithField>>>({});
  middlewares = input<Core.Middleware<Core.State, Core.Action>[]>([]);
  validators = input<CustomValidatorSchemas>({});
  validateOn = input<Core.ValidateOn>('eager');

  protected customFieldLoaders = computed(() => ({
    ...vanillaFieldLoaders,
    ...this.fieldLoaders(),
  }));
  protected customValidators = computed(() => initValidators({ ...this.validators() }));
  protected customMiddlewares = computed(() => [
    Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(jsonSchemaValidators)),
    ...this.middlewares(),
  ]);

  formHealth = output<Core.FormHealth>();
  formEvent = output<Core.FormEvent>();
}
