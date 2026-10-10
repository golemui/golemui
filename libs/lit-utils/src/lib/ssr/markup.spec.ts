import { LitElement } from 'lit';
import { describe, expect, it } from 'vitest';
import { safeDefine } from '../define';
import { cleanServerMarkup } from './markup';

// An element that renders into its light DOM, so its shadow root wrapper is removed.
class LightField extends LitElement {
  override createRenderRoot() {
    return this;
  }
}
safeDefine('markup-light-field', LightField);

describe('cleanServerMarkup: false boolean attributes', () => {
  it('removes a false-valued selected attribute and a false-valued checked attribute', () => {
    expect(cleanServerMarkup('<option value="free" selected="false">Free</option>')).toBe(
      '<option value="free">Free</option>',
    );
    expect(cleanServerMarkup('<input type="checkbox" checked="false">')).toBe(
      '<input type="checkbox">',
    );
  });

  it('removes every false-valued boolean attribute in one tag', () => {
    expect(
      cleanServerMarkup('<input disabled="false" hidden="false" required="false" value="x">'),
    ).toBe('<input value="x">');
  });

  it('handles a self-closing tag and attributes split across lines', () => {
    expect(cleanServerMarkup('<input checked="false"/>')).toBe('<input/>');
    expect(cleanServerMarkup('<input\n  type="radio"\n  checked="false"\n/>')).toBe(
      '<input\n  type="radio"\n/>',
    );
  });

  it('keeps aria and data attributes whose value is the string false', () => {
    const markup = '<li aria-selected="false" aria-disabled="false" data-resumed="false"></li>';
    expect(cleanServerMarkup(markup)).toBe(markup);
  });

  it('keeps enumerated attributes where false is a real value', () => {
    const markup = '<div draggable="false" spellcheck="false" contenteditable="false"></div>';
    expect(cleanServerMarkup(markup)).toBe(markup);
  });

  it('keeps true-valued, empty and bare boolean attributes', () => {
    const markup =
      '<input checked="true"><input checked=""><input checked><option selected>A</option>';
    expect(cleanServerMarkup(markup)).toBe(markup);
  });

  it('keeps text content that contains the same characters', () => {
    const escaped = '<p>checked=&quot;false&quot;</p>';
    expect(cleanServerMarkup(escaped)).toBe(escaped);
    const literal = '<p>an attribute checked="false" in text</p>';
    expect(cleanServerMarkup(literal)).toBe(literal);
  });

  it('returns markup without boolean attributes unchanged', () => {
    const markup =
      '<gui-core-form class="gui-form" defer-hydration><form id="f"><input value="Ada"></form></gui-core-form>';
    expect(cleanServerMarkup(markup)).toBe(markup);
  });
});

describe('cleanServerMarkup', () => {
  it('removes the hydration markers and leaves the other comments', () => {
    expect(
      cleanServerMarkup(
        '<!--lit-part abc--><p><!--lit-node 0--><!--lit-part-->A<!--/lit-part--><?><!-- note --></p><!--/lit-part-->',
      ),
    ).toBe('<p>A<!-- note --></p>');
  });

  it('unwraps the shadow root of a light-DOM element and keeps the real templates', () => {
    expect(
      cleanServerMarkup(
        '<markup-light-field><template shadowrootmode="open"><p>A</p><template><i>kept</i></template></template></markup-light-field>',
      ),
    ).toBe('<markup-light-field><p>A</p><template><i>kept</i></template></markup-light-field>');
  });

  it('unwraps the legacy shadowroot wrapper too', () => {
    expect(
      cleanServerMarkup(
        '<markup-light-field><template shadowroot="open">A</template></markup-light-field>',
      ),
    ).toBe('<markup-light-field>A</markup-light-field>');
  });

  it('keeps the hydration markers when asked to', () => {
    const markup = '<!--lit-part abc--><p>A</p><!--/lit-part-->';
    expect(cleanServerMarkup(markup, { keepMarkers: true })).toBe(markup);
  });

  it('keeps the shadow root of an element it does not render into its light DOM', () => {
    const markup = '<x-shadow><template shadowrootmode="open"><slot></slot></template></x-shadow>';
    expect(cleanServerMarkup(markup)).toBe(markup);
  });

  it('leaves every other byte as it was', () => {
    const markup =
      '<div  class=\'a\'   data-x="1"><br/><input checked=\'true\' value="&amp;"></div>';
    expect(cleanServerMarkup(markup)).toBe(markup);
  });
});
