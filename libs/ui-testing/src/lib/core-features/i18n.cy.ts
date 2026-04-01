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
              type: 'textinput',
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
              type: 'textinput',
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
              type: 'textinput',
              path: 'user.firstName',
            },
            {
              uid: 'greeting',
              kind: 'display',
              type: 'alert',
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

  describe('identityTranslator', () => {
    it('should update the form direction to rtl when setLang is called with an rtl language', () => {
      const translator = Core.identityTranslator('en-US');

      mountFn({
        localization: translator,
        formDef: Core.defineForm({
          form: [
            {
              uid: 'date',
              kind: 'input',
              type: 'calendar',
              path: 'date',
            },
          ],
        }),
      });

      cy.get('form').should('have.attr', 'dir', 'ltr');

      cy.wrap(null).then(() => translator.setLang('ar'));

      cy.get('form').should('have.attr', 'dir', 'rtl');
    });

    it('should update the calendar locale when setLang is called', () => {
      const translator = Core.identityTranslator('en-US');

      cy.clock(new Date(2024, 1, 15).getTime()); // February 15, 2024

      mountFn({
        localization: translator,
        formDef: Core.defineForm({
          form: [
            {
              uid: 'date',
              kind: 'input',
              type: 'calendar',
              path: 'date',
            },
          ],
        }),
      });

      cy.get('.gui-calendar__month-name').should('have.text', 'February');

      // Restore the clock so time flows normally again, otherwise "febrero" never happens
      cy.clock().then((clock) => {
        clock.restore();
      });

      cy.then(() => translator.setLang('es'));

      cy.get('.gui-calendar__month-name').should('have.text', 'febrero');
    });
  });
};
