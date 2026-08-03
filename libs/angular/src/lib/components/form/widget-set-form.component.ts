import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  InjectionToken,
  input,
  output,
  type Provider,
  type Type,
  viewChild,
} from '@angular/core';
import type {
  FormEvent,
  FormHealth,
  FormInitConfig,
  FormSubmitEvent,
  WithWidget,
} from '@golemui/core';
import {
  buildWidgetSetForm,
  type WidgetSetDefinition,
  type WidgetSetFormInitConfig,
} from '@golemui/dx';
import { FormCoreComponent } from './form.component';

/**
 * An Angular widget set definition: the loaders resolve to Angular component
 * classes.
 */
export type AngularWidgetSet<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> = WidgetSetDefinition<Type<WithWidget>, TConfig>;

/**
 * The widget set a {@link WidgetSetFormComponent} renders. Provided through
 * {@link provideWidgetSet}.
 */
export const GOLEMUI_WIDGET_SET = new InjectionToken<AngularWidgetSet<any>>('GOLEMUI_WIDGET_SET');

/**
 * Provides a widget set for {@link WidgetSetFormComponent}. A widget set
 * package puts this in the providers of its preconfigured form component
 * (the gui set's `gui-form` is one example). An application using the
 * generic component directly can also provide it at component, route, or
 * application level.
 *
 * @param widgetSet - The widget set's loaders, validator factory, and
 * optional form input resolver.
 */
export function provideWidgetSet(widgetSet: AngularWidgetSet<any>): Provider {
  return { provide: GOLEMUI_WIDGET_SET, useValue: widgetSet };
}

/**
 * The form component bound to the widget set provided through
 * {@link provideWidgetSet}. It accepts the widget set's form config,
 * resolves TS builder input through the widget set's `resolveFormInput`,
 * applies the shared merge precedence rules, and renders the core
 * {@link FormCoreComponent}.
 *
 * Widget set packages wrap this in a preconfigured component with a typed
 * `config` input. Angular components cannot be returned from a factory
 * function like the React, Vue, and Lit form components, so the widget set
 * arrives through dependency injection instead.
 */
@Component({
  imports: [CommonModule, FormCoreComponent],
  selector: 'gui-widget-set-form',
  templateUrl: './widget-set-form.component.html',
})
export class WidgetSetFormComponent {
  config = input.required<WidgetSetFormInitConfig<any>>();
  autocomplete = input<string | undefined>(undefined);
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary = input<Type<unknown> | undefined>(undefined);

  private widgetSet = inject(GOLEMUI_WIDGET_SET);
  private coreForm = viewChild(FormCoreComponent);

  protected bundle = computed(() => buildWidgetSetForm(this.widgetSet, this.config()));

  // The bundle is built with untyped loaders. This widget set's loaders
  // resolve to Angular components, so the config is an Angular init config.
  protected coreConfig = computed(
    () => this.bundle().initConfig as FormInitConfig<Type<WithWidget>>,
  );

  protected allValidators = computed(() => this.bundle().validators);

  formHealth = output<FormHealth>();
  formEvent = output<FormEvent>();
  formSubmit = output<FormSubmitEvent>();

  // Chain DX-registered event handlers with the emitted event so both fire.
  protected onCoreFormEvent(event: FormEvent): void {
    this.bundle().resolved.formEvent?.(event);
    this.formEvent.emit(event);
  }

  protected onCoreFormSubmitEvent(event: FormSubmitEvent): void {
    this.formSubmit.emit(event);
  }

  setData(data: Record<string, any>): void {
    this.coreForm()?.setData(data);
  }

  setMeta(meta: Record<string, any>): void {
    this.coreForm()?.setMeta(meta);
  }
}
