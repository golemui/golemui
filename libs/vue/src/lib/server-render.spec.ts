import { preloadFormWidgets } from '@golemui/core';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { beforeAll, describe, expect, it } from 'vitest';
import FormComponent from './FormComponent.vue';
import { buildConfig, noopValidators, stubWidgetLoaders } from './ssr.fixture';

const renderForm = () =>
  renderToString(
    createSSRApp({
      render: () => h(FormComponent, { config: buildConfig(), validators: noopValidators }),
    }),
  );

describe('server rendering a form in a plain node environment', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  it('emits every widget of the definition', async () => {
    const html = await renderForm();

    expect(html).toContain('<form');
    expect(html).toContain('class="stub-flex"');
    expect(html.match(/<input/g)).toHaveLength(2);
  });

  it('emits the values the form was initialized with', async () => {
    const html = await renderForm();

    expect(html).toContain('value="Ada"');
    expect(html).toContain('value="Lovelace"');
  });

  it('renders no loading placeholder, because the widgets were preloaded', async () => {
    const html = await renderForm();

    expect(html.toLowerCase()).not.toContain('loading');
  });

  it('renders no error text, because an untouched form has no errors', async () => {
    const html = await renderForm();

    expect(html.toLowerCase()).not.toContain('failed with');
    expect(html.toLowerCase()).not.toContain('gui-form-health');
  });
});

describe('server rendering determinism', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  it('produces identical markup across two separately created apps', async () => {
    const [first, second] = [await renderForm(), await renderForm()];

    expect(first).toBe(second);
  });

  it('gives every widget the same uid in both renders', async () => {
    const uids = (html: string) => [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

    expect(uids(await renderForm())).toEqual(uids(await renderForm()));
  });

  it('gives the form the same id in both renders, without an explicit formName', async () => {
    const formId = (html: string) => html.match(/<form id="([^"]+)"/)?.[1];

    const first = formId(await renderForm());
    const second = formId(await renderForm());

    expect(first).toBeDefined();
    expect(first).toBe(second);
  });
});
