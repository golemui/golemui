import { afterEach, describe, expect, it, vi } from 'vitest';
import { identityTranslator } from './i18n';

describe('identityTranslator - default language', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to en-US when no navigator global exists (server runtimes)', () => {
    vi.stubGlobal('navigator', undefined);
    expect(identityTranslator().lang).toBe('en-US');
  });

  it('uses navigator.language when a navigator exists', () => {
    vi.stubGlobal('navigator', { language: 'ca-ES' });
    expect(identityTranslator().lang).toBe('ca-ES');
  });

  it('falls back to en-US when navigator.language is empty', () => {
    vi.stubGlobal('navigator', { language: '' });
    expect(identityTranslator().lang).toBe('en-US');
  });

  it('keeps an explicitly passed language', () => {
    expect(identityTranslator('de-DE').lang).toBe('de-DE');
  });
});
