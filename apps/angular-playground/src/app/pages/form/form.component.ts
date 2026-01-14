import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AngularItemRenderer } from '@golemui/angular';
import * as Vanilla from '@golemui/angular-vanilla';
import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { APP_CONFIG } from '../../../environments/environment.model';
import { ComplexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';

@Component({
  imports: [CommonModule, Vanilla.FormComponent],
  selector: 'app-form-page',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class AppFormPage {
  private readonly appConfig = inject(APP_CONFIG);
  protected formDef = AppsShared.tests;
  protected formData = AppsShared.testsData;

  protected middlewares = [AppsShared.loggerMiddleware];
  protected customFieldLoaders = {
    heading: async () =>
      (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
  };
  protected validators: ValidatorsVanilla.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };
  protected itemRenderers: Record<string, AngularItemRenderer<any>> = {
    complexListItemRenderer: ComplexListItemRenderer,
  };

  protected error = '';

  constructor() {
    console.log(`Playground started in "${this.appConfig.env}" mode`);
  }

  protected onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      this.error = formHealth.message;
    }
  }

  protected async onFormEvent(event: Core.FormEvent) {
    await AppsShared.onFormEvent(event);
  }
}
