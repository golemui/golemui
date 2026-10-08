// @vitest-environment jsdom
import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cspStyleMap, type CspStyleInfo } from './csp-style-map';

describe('cspStyleMap', () => {
  const renderStyles = (container: HTMLElement, styleInfo: CspStyleInfo) => {
    render(html`<div style=${cspStyleMap(styleInfo)}></div>`, container);
    return container.querySelector('div') as HTMLDivElement;
  };

  afterEach(() => vi.restoreAllMocks());

  it('never writes the style attribute, not even on the first render', () => {
    const setAttribute = vi.spyOn(Element.prototype, 'setAttribute');
    const container = document.createElement('div');

    const el = renderStyles(container, { 'max-height': '120px' });
    renderStyles(container, { 'max-height': '240px' });

    expect(el.style.maxHeight).toBe('240px');
    expect(setAttribute.mock.calls.filter(([name]) => name === 'style')).toEqual([]);
  });

  it('accepts camelCase names, custom properties and numbers', () => {
    const el = renderStyles(document.createElement('div'), {
      maxWidth: '47px',
      '--gui-upload-pct': '40%',
      flex: 2,
    });

    expect(el.style.maxWidth).toBe('47px');
    expect(el.style.getPropertyValue('--gui-upload-pct')).toBe('40%');
    expect(el.style.flex).toContain('2');
  });

  it('removes properties that are dropped or nulled on a later render', () => {
    const container = document.createElement('div');
    const el = renderStyles(container, { height: '10px', minWidth: '0', gap: '4px' });

    renderStyles(container, { height: '10px', gap: undefined });

    expect(el.style.height).toBe('10px');
    expect(el.style.minWidth).toBe('');
    expect(el.style.gap).toBe('');
  });

  it('only works as the single part of a style attribute', () => {
    const container = document.createElement('div');
    expect(() =>
      render(html`<div class=${cspStyleMap({ height: '1px' })}></div>`, container),
    ).toThrow();
  });
});
