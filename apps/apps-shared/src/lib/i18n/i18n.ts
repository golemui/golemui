import type { I18nParams, I18nTranslator, TranslationKey } from '@golemui/core';
import i18next, { type Resource } from 'i18next';

export function initializeI18n(resources: Resource): I18nTranslator {
  i18next.init({
    fallbackLng: 'en',
    resources,
  });

  return {
    get lang() {
      return i18next.language;
    },
    translate(key: TranslationKey, params?: I18nParams, defaultValue?: string): string {
      return i18next.t(key, { ...params, defaultValue });
    },
    subscribe(listener: (lang: string) => void) {
      const onLanguageChanged = (lng: string) => listener(lng);
      i18next.on('languageChanged', onLanguageChanged);
      return () => {
        i18next.off('languageChanged', onLanguageChanged);
      };
    },
  };
}
