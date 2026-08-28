import { preloadFormWidgets } from '@golemui/core';
import { renderToString } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
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
