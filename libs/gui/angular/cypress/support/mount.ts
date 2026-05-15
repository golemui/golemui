import { CommonModule } from '@angular/common';
import { EventEmitter, Type } from '@angular/core';
import { FormCoreComponent } from '@golemui/angular';
import * as Core from '@golemui/core';
import { GuiFormInitConfig } from '@golemui/gui-shared';
import { MountOptions } from '@golemui/ui-testing';
import { createOutputSpy, mount } from 'cypress/angular';
import { FormComponent } from '../../src/lib/components/form/form.component';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: Core.WidgetLoaders<Type<Core.WithWidget>> = options.withCustomComponent
    ? {
        heading: async () =>
          (await import('../components/heading/heading.component')).HeadingComponent,
        customdate: async () =>
          (await import('../components/custom-date/custom-date.component')).CustomdateComponent,
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

  let formHealthOutput;
  if (options.formHealth) {
    const emitter = new EventEmitter<Core.FormHealth>();
    emitter.subscribe((e) => options.formHealth!(e));
    formHealthOutput = emitter;
  } else {
    formHealthOutput = createOutputSpy('formHealth');
  }

  const config: GuiFormInitConfig = {
    formDef: options.formDef,
    data: options.data,
    meta: options.meta,
    customWidgetLoaders,
    middlewares: options.middlewares ?? [],
    customValidators: options.validators,
    validateOn: options.validateOn ?? 'eager',
    localization: options.localization,
    dependencies: options.dependencies,
  };

  mount(FormComponent, {
    imports: [CommonModule, FormCoreComponent],
    componentProperties: {
      config,
      formHealth: formHealthOutput,
      formEvent: formEventOutput,
    },
  });
};
