import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Vanilla from '@golemui/angular-vanilla';
import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { APP_CONFIG } from '../../../environments/environment.model';

@Component({
  imports: [CommonModule, Angular.FormComponent],
  selector: 'app-form-page',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class AppFormPage {
  private readonly appConfig = inject(APP_CONFIG);
  protected middlewares = [
    Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(ValidatorsVanilla.jsonSchemaValidators)),
    AppsShared.loggerMiddleware,
  ];
  protected formDef = AppsShared.signin;
  protected formData = AppsShared.signinData;
  protected vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
    heading: async () =>
      (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
  };

  protected validators: Core.ValidatorFn<ValidatorsVanilla.Validator> =
    ValidatorsVanilla.initValidators({
      allowedNames: AppsShared.allowedNames,
    });

  protected error = '';

  constructor() {
    console.log(`Playground started in "${this.appConfig.env}" mode`);
  }

  protected onFormError(error: Core.FormStoreError) {
    if (error.kind === 'validation') {
      this.error = 'Validation errors: ' + error.errors;
    } else if (error.kind === 'fatal') {
      this.error = 'Fatal error: ' + error.error;
    }
  }

  protected async onFormEvent(event: Core.FormEvent) {
    await AppsShared.onFormEvent(event);
  }
}
