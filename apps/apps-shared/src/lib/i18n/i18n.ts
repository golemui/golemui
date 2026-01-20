import * as Core from '@golemui/core';
import i18next from 'i18next';

i18next.init({
  fallbackLng: 'en-US',
  lng: 'es-ES',
  resources: {
    en: {
      translation: { alert: { register: 'Register {{name}}', login: 'Login {{name}}' } },
    },
    es: {
      translation: { alert: { register: 'Regístrate {{name}}', login: 'Entra {{name}}' } },
    },
  },
});

export const i18nTranslator: Core.I18nTranslator = {
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
