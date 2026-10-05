import { html } from 'lit';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GuiSelect, GuiTabs, GuiTextinput } from '../../react';
import { renderElement, renderElementsInHtml, renderTemplate } from '../../ssr';
import '../components/currency';
import '../components/list';
import '../components/number';
import './ssr.fixture';

/**
 * Server spec for the framework integrations: one element rendered on its own (the React
 * components), the elements of a page a framework rendered (Vue, Nuxt), and the React components
 * themselves. Plain Node, as in a framework's server.
 */

const options = [
  { label: 'Starter', value: 'starter' },
  { label: 'Team', value: 'team' },
];

describe('rendering one element', () => {
  it('renders the content, marks it as server markup and returns the host attributes', () => {
    const rendered = renderElement('gui-textinput', {
      attributes: { uid: 'email', label: 'Email' },
      properties: { value: 'ada@example.com' },
    });
    expect(rendered?.attributes).toMatchObject({ uid: 'email', 'data-golemui-ssr': '' });
    expect(rendered?.innerHTML).toMatch(/<label[^>]*for="email"/);
    expect(rendered?.innerHTML).toMatch(/<input[^>]*id="email"[^>]*value="ada@example.com"/);
    expect(rendered?.outerHTML).toMatch(/^<gui-textinput[^>]*data-golemui-ssr[^>]*>/);
  });

  it('sets the properties an attribute cannot hold', () => {
    const rendered = renderElement('gui-select', {
      attributes: { uid: 'plan', value: 'team' },
      properties: { options },
    });
    expect(rendered?.innerHTML).toMatch(/<option\s+value="starter"/);
    expect(rendered?.innerHTML).toMatch(/<option\s+value="team"\s+selected/);
  });

  it('renders the value of the number fields, which the browser sets on the input itself', () => {
    const number = renderElement('gui-number', { attributes: { uid: 'seats', value: '3' } });
    expect(number?.innerHTML).toMatch(/<input[^>]*id="seats"[^>]*value="3"/);
    const currency = renderElement('gui-currency', {
      attributes: { uid: 'price', currency: 'EUR' },
      properties: { value: 49.5 },
    });
    expect(currency?.innerHTML).toMatch(/<input[^>]*id="price"[^>]*value="49.5"/);
    expect(renderElement('gui-number', { attributes: { uid: 'empty' } })?.innerHTML).not.toMatch(
      /<input[^>]*value=/,
    );
  });

  it('renders nothing for an element that wraps the app children or has a shadow root', () => {
    expect(renderElement('gui-tabs')).toBeUndefined();
    expect(renderElement('gui-list')).toBeUndefined();
    expect(renderElement('gui-not-an-element')).toBeUndefined();
  });
});

describe('rendering the elements of a framework page', () => {
  it('fills in the empty elements from their attributes', () => {
    const page = renderElementsInHtml(
      '<main><gui-textinput uid="email" label="Email" value="ada@example.com"></gui-textinput></main>',
    );
    expect(page).toMatch(/^<main><gui-textinput[^>]*data-golemui-ssr/);
    expect(page).toMatch(/<input[^>]*id="email"[^>]*value="ada@example.com"/);
    expect(page).toMatch(/<\/gui-textinput><\/main>$/);
  });

  it('reads a quoted attribute holding a > and decodes its entities', () => {
    const page = renderElementsInHtml(
      '<gui-textinput uid="a" label="Fees > 0 &amp; due"></gui-textinput>',
    );
    expect(page).toContain('Fees &gt; 0 &amp; due');
  });

  it('leaves alone the wrappers, the elements with content and the unknown tags', () => {
    const page =
      '<gui-tabs active="a"><gui-tab panel="a">A</gui-tab></gui-tabs>' +
      '<gui-textinput uid="b" data-golemui-ssr><input id="b"></gui-textinput>' +
      '<gui-not-an-element></gui-not-an-element>';
    expect(renderElementsInHtml(page)).toBe(page);
  });
});

describe('rendering a gui-list', () => {
  it('keeps its children and does not flatten its shadow root into them', async () => {
    const markup = await renderTemplate(
      html`<gui-list uid="l"><div role="option">A</div></gui-list>`,
    );
    expect(markup).toMatch(/<gui-list[^>]*><div role="option">A<\/div><\/gui-list>/);
    expect(markup).not.toContain('data-golemui-ssr');
  });
});

describe('the React components on the server', () => {
  it('render the content of the elements that render their own', () => {
    const markup = renderToString(
      createElement(GuiSelect, { uid: 'plan', label: 'Plan', options, value: 'team' }),
    );
    expect(markup).toMatch(/^<gui-select[^>]*data-golemui-ssr=""[^>]*defer-hydration=""/);
    expect(markup).toMatch(/<option\s+value="team"\s+selected/);
  });

  it('render the children of the elements that wrap them', () => {
    const markup = renderToString(
      createElement(GuiTabs, { active: 'a' }, createElement(GuiTextinput, { uid: 'company' })),
    );
    expect(markup).toMatch(/^<gui-tabs defer-hydration="">/);
    expect(markup).toMatch(/<gui-textinput[^>]*data-golemui-ssr=""[^>]*>.*id="company"/s);
  });

  it('render the empty tag when the server entry was not imported', () => {
    // Where @golemui/lit-utils keeps the server renderer (see server-renderer.ts).
    const hook = Symbol.for('golemui.server-element-renderer');
    const globals = globalThis as Record<symbol, unknown>;
    const render = globals[hook];
    delete globals[hook];
    try {
      expect(renderToString(createElement(GuiTextinput, { uid: 'email' }))).toBe(
        '<gui-textinput defer-hydration=""></gui-textinput>',
      );
    } finally {
      globals[hook] = render;
    }
  });
});
