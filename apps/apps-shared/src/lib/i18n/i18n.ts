import * as Core from '@golemui/core';
import i18next from 'i18next';

i18next.init({
  fallbackLng: 'en',
  lng: 'es',
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
  translate(key: Core.TranslationKey, params?: Core.I18nParams, defaultValue?: string): string {
    return i18next.t(key, { ...params, defaultValue });
  },
};
