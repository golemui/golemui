import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDirectionFromLanguage, identityTranslator, isTranslationConfig } from './i18n';

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

describe('getDirectionFromLanguage', () => {
  it.each(['ar', 'ar-EG', 'he', 'fa', 'ur'])('returns rtl for %s', (lang) => {
    expect(getDirectionFromLanguage(lang)).toBe('rtl');
  });

  it.each(['en-US', 'es', 'fr-CA', 'ca-ES', 'ja'])('returns ltr for %s', (lang) => {
    expect(getDirectionFromLanguage(lang)).toBe('ltr');
  });

  it('uses the script of the tag when it is given', () => {
    expect(getDirectionFromLanguage('az-Arab')).toBe('rtl');
    expect(getDirectionFromLanguage('az-Latn')).toBe('ltr');
  });
});

describe('identityTranslator - language changes', () => {
  it('returns the translation key unchanged', () => {
    expect(identityTranslator('en-US').translate('form.title')).toBe('form.title');
  });

  it('changes the language and tells each subscriber the new language', () => {
    const translator = identityTranslator('en-US');
    const first: string[] = [];
    const second: string[] = [];
    translator.subscribe((lang) => first.push(lang));
    translator.subscribe((lang) => second.push(lang));

    translator.setLang('fr-FR');

    expect(translator.lang).toBe('fr-FR');
    expect(first).toEqual(['fr-FR']);
    expect(second).toEqual(['fr-FR']);
  });

  it('stops telling a subscriber after it unsubscribes', () => {
    const translator = identityTranslator('en-US');
    const kept: string[] = [];
    const removed: string[] = [];
    translator.subscribe((lang) => kept.push(lang));
    const unsubscribe = translator.subscribe((lang) => removed.push(lang));

    unsubscribe();
    translator.setLang('fr-FR');

    expect(removed).toEqual([]);
    expect(kept).toEqual(['fr-FR']);
  });
});

describe('isTranslationConfig', () => {
  it.each([{ key: 'form.title' }, { key: 'form.title', params: { n: 1 }, default: 'Title' }])(
    'accepts an object with a string key: %j',
    (value) => {
      expect(isTranslationConfig(value)).toBe(true);
    },
  );

  it.each([null, undefined, 'form.title', 42, {}, { key: 1 }, { default: 'Title' }])(
    'rejects %j',
    (value) => {
      expect(isTranslationConfig(value)).toBe(false);
    },
  );
});
