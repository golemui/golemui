import { preloadFormWidgets } from '@golemui/core';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FormComponent } from './FormComponent';
import { buildConfig, noopValidators, stubWidgetLoaders } from './ssr.fixture';

const renderForm = () =>
  renderToString(<FormComponent config={buildConfig()} validators={noopValidators} />);

describe('server rendering a form in a plain node environment', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  it('emits every widget of the definition', () => {
    const html = renderForm();

    expect(html).toContain('<form');
    expect(html).toContain('class="stub-flex"');
    expect(html.match(/<input/g)).toHaveLength(2);
  });

  // Native constraint validation stays off: the engine owns validation, and the form-associated
  // gui-* elements planned for v2 would otherwise trigger the browser's own validation UI.
  it('turns off native form validation', () => {
    expect(renderForm()).toMatch(/<form[^>]*\snovalidate/i);
  });

  it('emits the values the form was initialized with', () => {
    const html = renderForm();

    expect(html).toContain('value="Ada"');
    expect(html).toContain('value="Lovelace"');
  });

  it('renders no loading placeholder, because the widgets were preloaded', () => {
    const html = renderForm();

    expect(html.toLowerCase()).not.toContain('loading');
  });

  it('renders no error text, because an untouched form has no errors', () => {
    const html = renderForm();

    expect(html.toLowerCase()).not.toContain('failed with');
    expect(html.toLowerCase()).not.toContain('gui-form-health');
  });
});

describe('server rendering a headless form', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  it('renders the widget tree without the form wrapper', () => {
    const html = renderToString(
      <FormComponent config={buildConfig()} validators={noopValidators} headless />,
    );

    expect(html).not.toContain('<form');
    expect(html).not.toContain('gui-form');
    expect(html).toContain('class="stub-flex"');
    expect(html.match(/<input/g)).toHaveLength(2);
  });

  it('keeps the form wrapper when headless is omitted', () => {
    const html = renderForm();

    expect(html).toContain('<div class="gui-form">');
    expect(html).toContain('<form');
  });
});

describe('server rendering determinism', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  it('produces identical markup across two separately created trees', () => {
    const [first, second] = [renderForm(), renderForm()];

    expect(first).toBe(second);
  });

  it('gives every widget the same uid in both renders', () => {
    const uids = (html: string) => [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

    expect(uids(renderForm())).toEqual(uids(renderForm()));
  });

  it('gives the form the same id in both renders, without an explicit formName', () => {
    const formId = (html: string) => html.match(/<form id="([^"]+)"/)?.[1];

    const first = formId(renderForm());
    const second = formId(renderForm());

    expect(first).toBeDefined();
    expect(first).toBe(second);
  });
});

describe('server rendering the form health', () => {
  const buildDuplicateUidConfig = () => ({
    ...buildConfig(),
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout' as const,
        type: 'flex',
        children: [
          { kind: 'input', type: 'textinput', path: 'firstName', uid: 'same-uid' },
          { kind: 'input', type: 'textinput', path: 'lastName', uid: 'same-uid' },
        ],
      },
    },
  });

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call formHealth for a valid config, because effects do not run on the server', () => {
    const formHealth = vi.fn();

    const html = renderToString(
      <FormComponent config={buildConfig()} validators={noopValidators} formHealth={formHealth} />,
    );

    expect(html).toContain('class="stub-flex"');
    expect(formHealth).not.toHaveBeenCalled();
  });

  it('writes the error message of a duplicate uid into the markup and logs nothing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const html = renderToString(
      <FormComponent config={buildDuplicateUidConfig()} validators={noopValidators} />,
    );

    expect(html).toContain('gui-form-health-error');
    expect(html).toContain('[21] Duplicate UID');
    expect(html).not.toContain('<input');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('does not call a load handler during the server render', () => {
    const formEvent = vi.fn();

    renderToString(
      <FormComponent config={buildConfig()} validators={noopValidators} formEvent={formEvent} />,
    );

    expect(formEvent).not.toHaveBeenCalled();
  });
});
