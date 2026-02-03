import * as Core from '@golemui/core';
import i18next from 'i18next';
import { MountComponentFn } from '../utils';

i18next.init({
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        user: { name: { label: 'Translated User Name Label' }, greeting: '{{hello}}, {{name}}!' },
      },
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

export const runI18nTests = (mountFn: MountComponentFn) => {
  describe('i18n', () => {
    it('should find and apply the textinput translation label', () => {
      const uid = 'textinput-uid';
      mountFn({
        localization: i18nTranslator,
        formDef: Core.defineForm({
          form: [
            {
              uid,
              kind: 'input',
              widget: 'textinput',
              label: {
                key: 'user.name.label',
              },
              path: 'test',
            },
          ],
        }),
      });
      cy.get(`label[for="${uid}"]`).should('exist').contains('Translated User Name Label');
    });

    it('should apply the default translation when the key does not exists', () => {
      const uid = 'textinput-uid';
      mountFn({
        localization: i18nTranslator,
        formDef: Core.defineForm({
          form: [
            {
              uid,
              kind: 'input',
              widget: 'textinput',
              label: {
                key: 'a.b.c.d',
                default: 'This is the default label',
              },
              path: 'test',
            },
          ],
        }),
      });
      cy.get(`label[for="${uid}"]`).should('exist').contains('This is the default label');
    });

    it('should apply interpolate $form and static params', () => {
      mountFn({
        localization: i18nTranslator,
        formDef: Core.defineForm({
          form: [
            {
              uid: 'first-name',
              kind: 'input',
              widget: 'textinput',
              path: 'user.firstName',
            },
            {
              uid: 'greeting',
              kind: 'display',
              widget: 'alert',
              props: {
                text: {
                  key: 'user.greeting',
                  params: {
                    hello: 'Hola',
                    name: '$form.user.firstName',
                  },
                },
              },
            },
          ],
        }),
      });
      cy.get(`[data-cy="first-name_textinput"]`).type('Pol');
      cy.get(`.gui-alert [role="alert"]`).contains('Hola, Pol!');
    });
  });
};
