import { preloadFormWidgets, type FormInitConfig, type WithWidget } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-lit';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { initValidators } from '@golemui/gui-validators';
import {
  resumeServerRenderedForm,
  type FormElement,
  type Type,
  type WidgetSetFormElement,
} from '@golemui/lit';
import { config } from './form-config';

// The preload has to finish before the resume, or the first client render would resolve
// no widgets. styles.scss is linked from index.html, so the page is styled with
// JavaScript disabled.
preloadFormWidgets({ widgetLoaders }).then(() => {
  const form = document.querySelector<HTMLElement>(
    'gui-form',
  ) as WidgetSetFormElement<GuiFormInitConfig> | null;
  if (!form) {
    throw new Error('The gui-form element is missing from the server markup');
  }

  // resumeServerRenderedForm is typed for the core gui-core-form element. The widget set
  // element follows the same contract but takes the widget set config, so the call needs
  // casts. It also builds its own validators, so the ones passed here are ignored.
  resumeServerRenderedForm(form as unknown as FormElement, {
    config: config as unknown as FormInitConfig<Type<WithWidget>>,
    validators: initValidators(),
  });

  const status = document.querySelector<HTMLElement>('.harness__status');
  if (status) {
    status.dataset['resumed'] = 'true';
    status.textContent = 'Resumed on the client';
  }
});
