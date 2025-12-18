import { MountOptions } from '@golemui/ui-testing';
import * as Core from '@golemui/core';
import { Type } from '@angular/core';
import { mount } from 'cypress/angular';
import { CommonModule } from '@angular/common';
import { FormCoreComponent } from '@golemui/angular';
import { FormComponent } from '../../src/lib/components/form/form.component';

export const mountFramework = (options: MountOptions) => {
  const fieldLoaders: Core.FieldLoaders<Type<Core.WithField>> = options.withCustomComponent
    ? {
        heading: async () =>
          (await import('../components/heading/heading.component')).HeadingComponent,
      }
    : {};
  mount(FormComponent, {
    imports: [CommonModule, FormCoreComponent],
    componentProperties: {
      formDef: options.formDef,
      fieldLoaders: fieldLoaders,
      middlewares: options.middlewares ?? [],
      validators: options.validators,
    },
  });
};
