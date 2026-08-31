// @vitest-environment jsdom
import { preloadFormWidgets } from '@golemui/core';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormElement } from './components/form/form.element';
import { resumeServerRenderedForm } from './ssr/resume';
import {
  buildConfig,
  canonicalServerMarkup,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

/**
 * Resume spec: loads the canonical server markup into the DOM (the server render
 * spec asserts that markup byte for byte), verifies the defer-hydration hold, and
 * verifies that the resume entry point replaces the markup with an equivalent live
 * render.
 */

// Lit renders on the microtask schedule, so waiting one macrotask completes every
// nested first render.
const afterLitRenderSchedule = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('resuming a server rendered form', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders as any });
  });

  beforeEach(() => {
    document.body.innerHTML = canonicalServerMarkup;
  });

  it('holds the server markup unchanged while defer-hydration is present', async () => {
    const before = document.body.innerHTML;
    await afterLitRenderSchedule();
    await afterLitRenderSchedule();
    expect(document.body.innerHTML).toBe(before);
  });

  it('replaces the server markup with one equivalent live render', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = document.querySelector('gui-core-form') as FormElement;

    resumeServerRenderedForm(form, { config: buildConfig(), validators: noopValidators });
    await afterLitRenderSchedule();
    await afterLitRenderSchedule();

    // The same features the server markup contained, read from the live DOM.
    expect(document.querySelectorAll('form')).toHaveLength(1);
    expect(document.querySelector('form')?.id).toBe('fixture-form');

    const serverDocument = new DOMParser().parseFromString(canonicalServerMarkup, 'text/html');
    const serverInputs = [...serverDocument.querySelectorAll('input')].map((input) => [
      input.id,
      input.getAttribute('value'),
    ]);
    const liveInputs = [...document.querySelectorAll('input')].map((input) => [
      input.id,
      input.value,
    ]);
    expect(liveInputs).toEqual(serverInputs);
    expect(liveInputs).toHaveLength(2);

    expect(document.querySelector('gui-core-form')?.hasAttribute('defer-hydration')).toBe(false);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('runs load handlers once the client has resumed, and only then', async () => {
    const onFormEvent = vi.fn();
    const form = document.querySelector('gui-core-form') as FormElement;
    form.addEventListener('formEvent', (event) => onFormEvent((event as CustomEvent).detail));

    // The markup upgrade alone emits nothing: load waits for the resume.
    await afterLitRenderSchedule();
    expect(onFormEvent).not.toHaveBeenCalled();

    resumeServerRenderedForm(form, { config: buildConfig(), validators: noopValidators });
    await afterLitRenderSchedule();
    await afterLitRenderSchedule();

    expect(onFormEvent).toHaveBeenCalledTimes(1);
    expect(onFormEvent).toHaveBeenCalledWith(expect.objectContaining({ name: 'stubLoaded' }));
  });

  it('accepts user input after the resume', async () => {
    const form = document.querySelector('gui-core-form') as FormElement;
    resumeServerRenderedForm(form, { config: buildConfig(), validators: noopValidators });
    await afterLitRenderSchedule();
    await afterLitRenderSchedule();

    const input = document.getElementById('firstName-textinput') as HTMLInputElement;
    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('Grace');
  });
});
