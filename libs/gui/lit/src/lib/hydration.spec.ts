// @vitest-environment jsdom
import {
  preloadFormWidgets,
  type FormEvent,
  type FormInitConfig,
  type FormSubmitEvent,
  type WithWidget,
} from '@golemui/core';
import { initValidators } from '@golemui/gui-validators';
import { resumeServerRenderedForm, type FormElement, type Type } from '@golemui/lit';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import './components/form.element';
import serverMarkup from './goldens/resume-form.html?raw';
import { resumeFormConfig as config } from './ssr.fixture';
import { widgetLoaders } from './widget.loaders';

/**
 * Resume spec against the real widget set: loads the server markup of a `gui-form` (the server
 * render spec writes it in plain Node) into the DOM, and `resumeServerRenderedForm` replaces it
 * with a live client render, as an app does.
 */

// Lit renders on the microtask schedule, so one macrotask completes every nested render.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('resuming a server-rendered gui-form', () => {
  let formEvents: FormEvent[];
  let consoleErrors: string[];

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders });
  }, 30_000);

  beforeEach(() => {
    formEvents = [];
    consoleErrors = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      consoleErrors.push(args.map(String).join(' '));
    });
    document.body.innerHTML = serverMarkup;
    form().addEventListener('formEvent', (event) =>
      formEvents.push((event as CustomEvent<FormEvent>).detail),
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  const form = () => document.querySelector('gui-form') as HTMLElement;
  const input = (id: string) => document.getElementById(id) as HTMLInputElement;

  const resume = async () => {
    // The gui-form element builds its own validators, so the ones passed here are not used.
    resumeServerRenderedForm(form() as unknown as FormElement, {
      config: config as unknown as FormInitConfig<Type<WithWidget>>,
      validators: initValidators(),
    });
    await settle();
  };

  it('holds the server markup unchanged while defer-hydration is present', async () => {
    expect(input('firstName-textinput').getAttribute('value')).toBe('Ada');
    const before = document.body.innerHTML;

    await settle();

    expect(document.body.innerHTML).toBe(before);
    expect(formEvents).toEqual([]);
  });

  it('shows the server values in the live render and removes every defer-hydration', async () => {
    const serverInput = input('firstName-textinput');

    await resume();

    expect(input('firstName-textinput')).not.toBe(serverInput);
    expect(input('firstName-textinput').value).toBe('Ada');
    expect(input('seats-number').value).toBe('3');
    expect(input('acceptTerms-checkbox').checked).toBe(true);
    expect(document.querySelectorAll('form')).toHaveLength(1);
    expect(document.querySelector('form')?.id).toBe('gui-lit-resume-form');
    expect(document.querySelectorAll('[defer-hydration]')).toHaveLength(0);
    expect(consoleErrors).toEqual([]);
  });

  it('fires the load event once, after the resume', async () => {
    await settle();
    expect(formEvents).toEqual([]);

    await resume();

    expect(formEvents).toEqual([expect.objectContaining({ name: 'firstNameLoaded' })]);
  });

  it('submits the value typed after the resume', async () => {
    const submits: FormSubmitEvent[] = [];
    form().addEventListener('formSubmit', (event) =>
      submits.push((event as CustomEvent<FormSubmitEvent>).detail),
    );
    await resume();

    const firstName = input('firstName-textinput');
    firstName.value = 'Grace';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    document.querySelector('form')?.requestSubmit();
    await settle();

    expect(submits).toHaveLength(1);
    expect(submits[0].data).toEqual({ firstName: 'Grace', seats: 3, acceptTerms: true });
  });
});
