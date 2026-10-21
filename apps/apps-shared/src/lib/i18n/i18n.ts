import type { I18nParams, I18nTranslator, TranslationKey } from '@golemui/core';
import i18next, { type Resource } from 'i18next';

let initialized = false;

export function initializeI18n(resources: Resource): I18nTranslator {
  // Several page modules call this at load time. A second `init` rebuilds the store from the
  // resources it receives, so init once and add every caller's bundles to the same store.
  if (!initialized) {
    initialized = true;
    i18next.init({
      fallbackLng: 'en',
      resources: {},
    });
  }
  for (const [language, namespaces] of Object.entries(resources)) {
    for (const [namespace, bundle] of Object.entries(namespaces)) {
      i18next.addResourceBundle(language, namespace, bundle, true, true);
    }
  }

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
