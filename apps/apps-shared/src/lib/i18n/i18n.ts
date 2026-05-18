import type * as Core from '@golemui/core';
import i18next, { type Resource } from 'i18next';

export function initializeI18n(resources: Resource): Core.I18nTranslator {
  i18next.init({
    fallbackLng: 'en',
    resources,
  });

  return {
    get lang() {
      return i18next.language;
    },
    translate(key: Core.TranslationKey, params?: Core.I18nParams, defaultValue?: string): string {
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
