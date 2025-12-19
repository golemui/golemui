import { MountOptions } from '@golemui/ui-testing';
import * as Core from '@golemui/core';
import { EventEmitter, Type } from '@angular/core';
import { createOutputSpy, mount } from 'cypress/angular';
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

  let formEventOutput;
  if (options.formEvent) {
    const emitter = new EventEmitter<Core.FormEvent>();
    emitter.subscribe((e) => options.formEvent!(e));
    formEventOutput = emitter;
  } else {
    formEventOutput = createOutputSpy('formEvent');
  }

  let formErrorOutput;
  if (options.formError) {
    const emitter = new EventEmitter<Core.FormStoreError>();
    emitter.subscribe((e) => options.formError!(e));
    formErrorOutput = emitter;
  } else {
    formErrorOutput = createOutputSpy('formError');
  }

  mount(FormComponent, {
    imports: [CommonModule, FormCoreComponent],
    componentProperties: {
      formDef: options.formDef,
      fieldLoaders: fieldLoaders,
      middlewares: options.middlewares ?? [],
      validators: options.validators,
      formError: formErrorOutput,
      formEvent: formEventOutput,
    },
  });
};
