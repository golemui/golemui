import {
  enableDevMode,
  preloadFormWidgets,
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  type WithWidget,
} from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { initValidators } from '@golemui/gui-validators';
import {
  resumeServerRenderedForm,
  type FormElement,
  type FormHealthBoundary,
  type Type,
  type WidgetSetFormElement,
} from '@golemui/lit';
import { allWidgetLoaders } from './widget-loaders';
import '@golemui/gui-lit';

export type GuiFormElement = WidgetSetFormElement<GuiFormInitConfig>;

export type ResumeFormOptions = {
  formHealthBoundary?: FormHealthBoundary;
  formEvent?: (event: FormEvent) => void;
  formSubmit?: (event: FormSubmitEvent) => void;
  formHealth?: (event: FormHealth) => void;
};

if (import.meta.env.DEV) {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}

/**
 * Client side of a playground page: takes over the server-rendered `<gui-form>`.
 *
 * The server markup holds every element inert through `defer-hydration`. This preloads
 * the same widgets the server used, attaches the page's listeners and properties, and
 * resumes the form: the server children are replaced by one live client render before
 * the next paint. The preload has to finish before the resume, or the first client render
 * would resolve no widgets.
 */
export async function resumeForm(
  config: GuiFormInitConfig,
  options: ResumeFormOptions = {},
): Promise<GuiFormElement> {
  await preloadFormWidgets({ widgetLoaders: allWidgetLoaders });

  const form = document.querySelector<GuiFormElement>('gui-form');
  if (!form) {
    throw new Error('The gui-form element is missing from the server markup');
  }

  // Listeners go on before the resume so the events of the first render are not missed.
  if (options.formEvent) {
    form.addEventListener('formEvent', (event) =>
      options.formEvent?.((event as CustomEvent<FormEvent>).detail),
    );
  }
  if (options.formSubmit) {
    form.addEventListener('formSubmit', (event) =>
      options.formSubmit?.((event as CustomEvent<FormSubmitEvent>).detail),
    );
  }
  if (options.formHealth) {
    form.addEventListener('formHealth', (event) =>
      options.formHealth?.((event as CustomEvent<FormHealth>).detail),
    );
  }
  form.formHealthBoundary = options.formHealthBoundary;

  // resumeServerRenderedForm is typed for the core gui-core-form element. The widget set
  // element follows the same contract but takes the widget set config, so the call needs
  // casts. It also builds its own validators, so the ones passed here are ignored.
  resumeServerRenderedForm(form as unknown as FormElement, {
    config: config as unknown as FormInitConfig<Type<WithWidget>>,
    validators: initValidators(),
  });
  return form;
}

/** Appends the message of every errored FormHealth event to the page's error list. */
export function collectFormErrors(list: HTMLElement | null): (event: FormHealth) => void {
  return (event) => {
    if (event.status !== 'errored' || !list) {
      return;
    }
    const item = document.createElement('li');
    item.textContent = event.message;
    list.appendChild(item);
    list.parentElement?.removeAttribute('hidden');
  };
}
