import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Vanilla from '@formforge/angular-vanilla';
import * as Core from '@formforge/core';
import { APP_CONFIG } from '../../../environments/environment.model';
import { loggerMiddleware } from '../../middlewares/logger.middleware';
import { signin, signinData } from '../../mocks';

@Component({
  imports: [CommonModule, Angular.FormComponent],
  selector: 'app-form-page',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class AppFromPage {
  private readonly appConfig = inject(APP_CONFIG);
  protected middlewares = [loggerMiddleware];
  protected formDef = signin;
  protected formData = signinData;
  protected vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
    heading: async () =>
      (await import('../../custom-fields/heading/heading.component'))
        .HeadingComponent,
  };

  protected error = '';

  constructor() {
    console.log(`Playground started in "${this.appConfig.env}" mode`);
  }

  protected onFormError(error: Core.FormStoreError) {
    this.error = '';
    if (error.kind === 'validation') {
      this.error = 'Validation errors: ' + error.errors;
    } else if (error.kind === 'fatal') {
      this.error = 'Fatal error: ' + error.error;
    }
  }

  protected onFormEvent(event: Core.FormEvent) {
    console.groupCollapsed(`onFormEvent('${event.name}')`);
    console.log(event.data);
    console.groupEnd();
  }
}
