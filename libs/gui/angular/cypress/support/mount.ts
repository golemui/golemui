import { CommonModule } from '@angular/common';
import { EventEmitter, provideZoneChangeDetection, type Type } from '@angular/core';
import { FormCoreComponent } from '@golemui/angular';
import type {
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  WidgetLoaders,
  WithWidget,
} from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { type MountOptions } from '@golemui/ui-testing';
import { createOutputSpy, mount } from 'cypress/angular';
import { FormComponent } from '../../src/lib/components/form/form.component';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: WidgetLoaders<Type<WithWidget>> = options.withCustomComponent
    ? {
        heading: async () =>
          (await import('../components/heading/heading.component')).HeadingComponent,
        customdate: async () =>
          (await import('../components/custom-date/custom-date.component')).CustomdateComponent,
      }
    : {};

  let formEventOutput;
  if (options.formEvent) {
    const emitter = new EventEmitter<FormEvent>();
    emitter.subscribe((e) => options.formEvent!(e));
    formEventOutput = emitter;
  } else {
    formEventOutput = createOutputSpy('formEvent');
  }

  let formHealthOutput;
  if (options.formHealth) {
    const emitter = new EventEmitter<FormHealth>();
    emitter.subscribe((e) => options.formHealth!(e));
    formHealthOutput = emitter;
  } else {
    formHealthOutput = createOutputSpy('formHealth');
  }

  let formSubmitOutput;
  if (options.formSubmit) {
    const emitter = new EventEmitter<FormSubmitEvent>();
    emitter.subscribe((e) => options.formSubmit!(e));
    formSubmitOutput = emitter;
  } else {
    formSubmitOutput = createOutputSpy('formSubmit');
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
    functions: options.functions,
  };

  mount(FormComponent, {
    imports: [CommonModule, FormCoreComponent],
    providers: [provideZoneChangeDetection()],
    componentProperties: {
      config,
      formHealth: formHealthOutput,
      formEvent: formEventOutput,
      formSubmit: formSubmitOutput,
    },
  }).then(({ fixture }) => {
    // toObservable()'s internal effect is scheduled, not run, during the first detectChanges() call
    // made by mount(). A second call flushes it so config$ emits and the store is initialized
    // before onFormReady exposes the handle to the test.
    fixture.detectChanges();
    options.onFormReady?.({
      setData: (data) => fixture.componentRef.instance.setData(data),
      setMeta: (meta) => fixture.componentRef.instance.setMeta(meta),
    });
  });
};
