import { type InputWidget, preloadFormWidgets } from '@golemui/core';
import { Subject } from 'rxjs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderGuiFormHtml } from '../ssr';
import { ActionWidgetAdapter } from './adapters/action-widget.adapter';
import { InputWidgetAdapter } from './adapters/input-widget.adapter';
import { type LitFormContext } from './context/form.context';
import {
  buildConfig,
  canonicalServerMarkup,
  formData,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

/**
 * Server-markup spec: renders a form to a string in a plain node environment (no DOM
 * globals beyond the lit shim) and asserts on the markup.
 */

async function renderFixtureForm(options?: { keepMarkers?: boolean }): Promise<string> {
  return renderGuiFormHtml({
    config: buildConfig(),
    validators: noopValidators,
    keepMarkers: options?.keepMarkers,
  });
}

describe('server rendering a form in plain node', () => {
  let markup = '';

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders as any });
    markup = await renderFixtureForm();
  });

  it('matches the canonical markup the resume spec hydrates from', () => {
    expect(markup).toBe(canonicalServerMarkup);
  });

  it('renders the form tag with the explicit form name', () => {
    expect(markup).toContain('<gui-core-form');
    expect(markup).toMatch(/<form[^>]*id="fixture-form"/);
    expect(markup).not.toContain('Loading form...');
  });

  it('renders every widget of the definition', () => {
    expect(markup.match(/<gui-stub-input/g)).toHaveLength(2);
    expect(markup).toMatch(/<div[^>]*class="stub-flex"[^>]*id="root"/);
  });

  it('renders the data values into the inputs', () => {
    expect(markup).toMatch(/<input[^>]*id="firstName-textinput"[^>]*value="Ada"/);
    expect(markup).toMatch(/<input[^>]*id="lastName-textinput"[^>]*value="Lovelace"/);
    expect(markup).toMatch(/data-label="First name"/);
  });

  it('holds every element inert through defer-hydration', () => {
    expect(markup).toMatch(/<gui-core-form[^>]*defer-hydration/);
    expect(markup).toMatch(/<gui-widget[^>]*defer-hydration/);
    expect(markup).toMatch(/<gui-stub-input[^>]*defer-hydration/);
  });

  it('emits light DOM only: no shadow root wrappers and no marker comments', () => {
    expect(markup).not.toContain('<template');
    expect(markup).not.toContain('lit-part');
    expect(markup).not.toContain('lit-node');
    expect(markup).not.toContain('<?>');
  });

  it('keeps the hydration markers when keepMarkers is set', async () => {
    const withMarkers = await renderFixtureForm({ keepMarkers: true });
    expect(withMarkers).toContain('lit-part');
    expect(withMarkers).not.toContain('<template');
  });

  it('is deterministic: two renders produce identical markup', async () => {
    const second = await renderFixtureForm();
    expect(second).toBe(markup);
  });

  it('throws without an explicit formName', async () => {
    const config = buildConfig();
    delete config.formName;
    await expect(renderGuiFormHtml({ config, validators: noopValidators })).rejects.toThrow(
      /formName/,
    );
  });

  it('renders an untouched form without validation errors', () => {
    expect(formData.firstName).toBe('Ada'); // the data is set, yet no error markup exists
    expect(markup).not.toMatch(/error/i);
  });

  it('does not run load handlers, because load is a client lifecycle event', () => {
    // Adapter level: the node environment has no document global, so `init` must not emit.
    // The resume spec proves the client-side emission after resume.
    const emitEvent = vi.fn();
    const stubContext = {
      emitEvent,
      store: { state$: new Subject() },
      dependencies: {},
    } as unknown as LitFormContext<any>;
    const widget = {
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      uid: 'firstName-textinput',
      on: { load: 'stubLoaded' },
    } as unknown as InputWidget<string>;

    const inputAdapter = new InputWidgetAdapter<string, Record<string, never>>();
    inputAdapter.context = stubContext;
    inputAdapter.init(widget);

    const actionAdapter = new ActionWidgetAdapter<Record<string, never>>();
    actionAdapter.context = stubContext;
    actionAdapter.init({
      kind: 'action',
      type: 'button',
      uid: 'submit-button',
      label: 'Send',
      on: { load: 'stubLoaded' },
    } as any);

    expect(emitEvent).not.toHaveBeenCalled();
  });
});
