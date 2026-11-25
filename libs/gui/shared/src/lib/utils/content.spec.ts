import { describe, expect, it } from 'vitest';
import { imageClasses, typographyClasses, typographyTag } from './content';

describe('typography and image helpers', () => {
  it('renders a heading variant as its heading, and the text variants as a paragraph', () => {
    expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(typographyTag)).toEqual([
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ]);
    expect(typographyTag('body')).toBe('p');
    expect(typographyTag('small')).toBe('p');
  });

  it('falls back to body text for no variant or an unknown one, and never makes another tag', () => {
    expect(typographyTag(undefined)).toBe('p');
    expect(typographyTag('script')).toBe('p');
    expect(typographyClasses(undefined)).toBe('gui-typography gui-typography--body');
    expect(typographyClasses('h7')).toBe('gui-typography gui-typography--body');
  });

  it('gives a typography widget the class of its variant', () => {
    expect(typographyClasses('h2')).toBe('gui-typography gui-typography--h2');
    expect(typographyClasses('small')).toBe('gui-typography gui-typography--small');
  });

  it('gives an image the classes of its ratio and fit, and none for unknown values', () => {
    expect(imageClasses({})).toBe('gui-image');
    expect(imageClasses({ ratio: '16/9', fit: 'contain' })).toBe(
      'gui-image gui-image--ratio-16-9 gui-image--fit-contain',
    );
    expect(imageClasses({ ratio: '5/4' as never, fit: 'scale-down' as never })).toBe('gui-image');
  });
});
