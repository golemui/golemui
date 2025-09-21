import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Vanilla from '@formforge/angular-vanilla';
import * as Core from '@formforge/core';
import { APP_CONFIG } from '../../../environments/environment.model';
import { loggerMiddleware } from '../../middlewares/logger.middleware';
import { signin } from '../../mocks';

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
  protected vanillaFieldLoaders = Vanilla.vanillaFieldLoaders;

  protected error = '';

  constructor() {
    console.log(`Playground started in "${this.appConfig.env}" mode`);
  }

  protected onFormError(event: Core.FormStoreError) {
    this.error = '';
    if (event.kind === 'validation') {
      this.error = 'Validation errors: ' + event.errors;
    } else if (event.kind === 'fatal') {
      this.error = 'Fatal error: ' + event.error;
    }
  }
}
