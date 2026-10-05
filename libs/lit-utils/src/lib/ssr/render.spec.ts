import { JSDOM } from 'jsdom';
import { html, LitElement, ReactiveElement } from 'lit';
import { beforeAll, describe, expect, it } from 'vitest';
import { safeDefine } from '../define';
import { serverElementRenderer } from '../server-renderer';
import { renderElementsInDocument, renderElementsInHtml } from './page';
import { renderElement, renderTemplate } from './render';

/**
 * Server spec for the render functions, with a widget set of its own: the elements are found by
 * their safeDefine registration, never by their tag.
 */

class Field extends LitElement {
  static override properties = {
    label: { type: String },
    options: { attribute: false },
  };
  declare label: string | undefined;
  declare options: string[] | undefined;

  override createRenderRoot() {
    return this;
  }

  override render() {
    const options = (this.options ?? []).map((option) => html`<option>${option}</option>`);
    return html`<label>${this.label}</label
      ><select>
        ${options}
      </select>`;
  }
}

// A field holding another field: only the outer one gets the values passed to renderElement.
class Group extends LitElement {
  static override properties = { label: { type: String } };
  declare label: string | undefined;

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`<myui-field label="inner"></myui-field>`;
  }
}

// Registered, with a shadow root: its content is left to the browser.
class Shadowed extends LitElement {
  override render() {
    return html`<slot></slot>`;
  }
}

// Registered, not a LitElement: it only adds behaviour to its children, like a tabs element.
class Wrapper extends ReactiveElement {
  override createRenderRoot() {
    return this;
  }
}

// Answers the requests of the elements inside it, like a form's context provider.
class Provider extends LitElement {
  constructor() {
    super();
    this.addEventListener('myui-request', (event) => {
      (event as CustomEvent<{ answered?: boolean }>).detail.answered = true;
    });
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`<myui-wrapper
        ><myui-wrapper><myui-asker></myui-asker></myui-wrapper></myui-wrapper
      ><myui-shadowed></myui-shadowed><myui-asker></myui-asker>`;
  }
}

// Asks its provider on connect, as a field asks for the form context, and renders the answer.
class Asker extends LitElement {
  declare answered: boolean;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    const request = new CustomEvent<{ answered?: boolean }>('myui-request', {
      bubbles: true,
      composed: true,
      detail: {},
    });
    this.dispatchEvent(request);
    this.answered = request.detail.answered === true;
  }

  override render() {
    return html`<i>${this.answered ? 'answered' : 'unanswered'}</i>`;
  }
}

// Not registered through safeDefine: not rendered by these functions.
class Unregistered extends LitElement {
  override createRenderRoot() {
    return this;
  }
  override render() {
    return html`<b>unregistered</b>`;
  }
}

beforeAll(() => {
  safeDefine('myui-field', Field);
  safeDefine('myui-group', Group);
  safeDefine('myui-shadowed', Shadowed);
  safeDefine('myui-wrapper', Wrapper);
  safeDefine('myui-provider', Provider);
  safeDefine('myui-asker', Asker);
  customElements.define('other-field', Unregistered);
});

describe('renderElement', () => {
  it('renders an element of any widget set from its attributes and properties', () => {
    const rendered = renderElement('myui-field', {
      attributes: { label: 'Plan "A" > B', id: 'plan' },
      properties: { options: ['Starter', 'Team'] },
    });
    expect(rendered?.attributes).toEqual({
      label: 'Plan "A" > B',
      id: 'plan',
      'data-golemui-ssr': '',
    });
    // Lit keeps the template's own whitespace, so the patterns allow it between the tags.
    expect(rendered?.innerHTML).toMatch(/<label>Plan &quot;A&quot; &gt; B<\/label\s*>/);
    expect(rendered?.innerHTML).toMatch(/<option>Starter<\/option>\s*<option>Team<\/option>/);
    expect(rendered?.outerHTML).not.toContain('<template');
    expect(rendered?.outerHTML).not.toContain('lit-part');
  });

  it('passes the values to the element it renders, not to the elements in its content', () => {
    const rendered = renderElement('myui-group', { attributes: { label: 'outer' } });
    expect(rendered?.attributes['label']).toBe('outer');
    expect(rendered?.innerHTML).toMatch(/<myui-field\s+label="inner"[^>]*>/);
  });

  it('skips an invalid attribute name', () => {
    const rendered = renderElement('myui-field', { attributes: { 'a"b': 'x', label: 'L' } });
    expect(rendered?.attributes).toEqual({ label: 'L', 'data-golemui-ssr': '' });
  });

  it('renders nothing for a shadow root element, an unregistered element or an unknown tag', () => {
    expect(renderElement('myui-shadowed')).toBeUndefined();
    expect(renderElement('other-field')).toBeUndefined();
    expect(renderElement('myui-unknown')).toBeUndefined();
  });

  it('is the server renderer that framework components look up', () => {
    expect(serverElementRenderer()).toBe(renderElement);
  });
});

describe('renderElementsInHtml', () => {
  it('fills in the empty elements of a page and leaves every other byte as it was', () => {
    const page =
      '<!DOCTYPE html><html lang="en"><head><title>T</title></head>' +
      '<body><main class=\'x\'>\n  <myui-field label="A &amp; B"></myui-field>\n</main></body></html>';
    const result = renderElementsInHtml(page);
    const [before, after] = page.split('<myui-field label="A &amp; B"></myui-field>');
    expect(result.startsWith(before ?? '')).toBe(true);
    expect(result.endsWith(after ?? '')).toBe(true);
    expect(result).toMatch(/<label>A &amp; B<\/label\s*>/);
    expect(result).toMatch(/<myui-field label="A &amp; B" data-golemui-ssr>/);
  });

  it('works on a part of a page, with a quoted > in an attribute', () => {
    expect(renderElementsInHtml('<myui-field label="1 > 0"></myui-field>')).toMatch(
      /^<myui-field label="1 &gt; 0" data-golemui-ssr><label>1 &gt; 0<\/label\s*>/,
    );
  });

  it('leaves the elements with content, in a template, or already rendered', () => {
    const page =
      '<myui-field label="a"><!----></myui-field>' +
      '<myui-field label="b"> text </myui-field>' +
      '<template><myui-field label="c"></myui-field></template>' +
      '<myui-field label="d" data-golemui-ssr><label>d</label></myui-field>' +
      '<myui-shadowed></myui-shadowed><other-field></other-field>';
    expect(renderElementsInHtml(page)).toBe(page);
  });
});

describe('renderElementsInDocument', () => {
  it('renders the empty elements of a server DOM from their attributes and properties', () => {
    const { document } = new JSDOM(
      '<main><myui-field label="Plan"></myui-field><myui-field label="Kept"><i></i></myui-field></main>',
    ).window;
    const [field, kept] = Array.from(document.querySelectorAll('myui-field'));
    Object.assign(field as object, { options: ['Starter'] });

    renderElementsInDocument(document);

    expect(field?.hasAttribute('data-golemui-ssr')).toBe(true);
    expect(field?.innerHTML).toMatch(/<label>Plan<\/label\s*>/);
    expect(field?.innerHTML).toContain('<option>Starter</option>');
    expect(kept?.innerHTML).toBe('<i></i>');
  });
});

describe('renderTemplate', () => {
  it('renders the light DOM elements as children and keeps the other shadow roots', async () => {
    const markup = await renderTemplate(
      html`<myui-field label="A"></myui-field><myui-shadowed><p>child</p></myui-shadowed>`,
    );
    expect(markup).toMatch(/<myui-field\s+label="A" data-golemui-ssr defer-hydration><label>A/);
    expect(markup).toMatch(/<myui-shadowed\s+defer-hydration><p>child<\/p><\/myui-shadowed>/);
    expect(markup).not.toContain('lit-part');
  });

  it('keeps the provider on the event path of the elements after a wrapper or a shadow host', async () => {
    // @lit-labs/ssr drops an ancestor from the event path when an element without a renderer
    // instance closes, and keeps a host that rendered no shadow root as the host after it.
    const markup = await renderTemplate(html`<myui-provider></myui-provider>`);
    expect(markup.match(/<i>answered<\/i>/g)).toHaveLength(2);
    expect(markup).not.toContain('unanswered');
    expect(markup).toMatch(/<myui-wrapper\s+defer-hydration><myui-wrapper\s+defer-hydration>/);
  });
});
