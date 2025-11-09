import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Vanilla from '@formforge/angular-vanilla';
import * as Core from '@formforge/core';
import { testingJsonSchema } from '@formforge/shared-vanilla';
import { APP_CONFIG } from '../../../environments/environment.model';
import { vanillaSchemaToFieldMap } from '../../middlewares/json-schema-vanilla';
import { jsonSchemaMiddleware } from '../../middlewares/json-schema.middleware';

@Component({
  imports: [CommonModule, Angular.FormComponent],
  selector: 'app-form-page',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class AppFormPage {
  private readonly appConfig = inject(APP_CONFIG);
  protected middlewares = [jsonSchemaMiddleware(vanillaSchemaToFieldMap)];
  protected formDef = testingJsonSchema;
  protected formData = {};
  protected vanillaFieldLoaders = {
    ...Vanilla.vanillaFieldLoaders,
    heading: async () =>
      (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
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

  protected async onFormEvent(event: Core.FormEvent) {
    const eventHandler = eventHandlers[event.name as keyof typeof eventHandlers];
    if (eventHandler) {
      console.log(`✅ onFormEvent('${event.name}')`);
      eventHandler(event);
    } else {
      console.groupCollapsed(`⚠️ Unhandled - onFormEvent('${event.name}')`);
      console.log(event.data);
      console.groupEnd();
    }
  }
}

const eventHandlers = {
  async getSubregions(event: Core.FormEvent) {
    const response = await fetch('/data/subregions.json');
    const subregions = await response.json();
    event.callback({
      type: 'OVERRIDE_FIELD_PROP',
      payload: { path: 'subregion', prop: 'options', value: subregions },
    });
  },
  async getCountries(event: Core.FormEvent) {
    const response = await fetch('/data/countries.json');
    const countries = await response.json();
    const subregion = event.data['subregion'] as string;
    event.callback({
      type: 'OVERRIDE_FIELD_PROP',
      payload: {
        path: 'country',
        prop: 'options',
        value: countries[subregion.toLowerCase()],
      },
    });
  },
};
