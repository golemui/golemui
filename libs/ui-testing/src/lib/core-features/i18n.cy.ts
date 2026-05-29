import {
  type I18nParams,
  type I18nTranslator,
  type TranslationKey,
  defineForm,
  identityTranslator,
} from '@golemui/core';
import i18next from 'i18next';
import { type MountComponentFn } from '../utils';

i18next.init({
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        user: {
          name: { label: 'Translated User Name Label' },
          greeting: '{{hello}}, {{name}}! You are {{connectionStatus}}.',
        },
      },
    },
  },
});

export const i18nTranslator: I18nTranslator = {
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

export const runI18nTests = (mountFn: MountComponentFn) => {
  describe('i18n', () => {
    it('should find and apply the textinput translation label', () => {
      const uid = 'textinput-uid';
      mountFn({
        localization: i18nTranslator,
        formDef: defineForm({
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
        formDef: defineForm({
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

    it('should apply interpolate $form and $meta static params', () => {
      mountFn({
        localization: i18nTranslator,
        meta: { connectionStatus: 'online' },
        formDef: defineForm({
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
                    connectionStatus: '$meta.connectionStatus',
                  },
                },
              },
            },
          ],
        }),
      });
      cy.get(`[data-cy="first-name_textinput"]`).type('Pol');
      cy.get(`.gui-alert [role="alert"]`).contains('Hola, Pol! You are online.');
    });

    it('should evaluate string concatenation expression params in i18n translations', () => {
      i18next.addResourceBundle(
        'en',
        'translation',
        { 'user.fullName': 'Hello, {{fullName}}!' },
        true,
        true,
      );

      mountFn({
        localization: i18nTranslator,
        data: { firstName: 'Jane', lastName: 'Doe' },
        formDef: defineForm({
          form: [
            {
              uid: 'greeting',
              kind: 'display',
              type: 'alert',
              props: {
                text: {
                  key: 'user.fullName',
                  params: { fullName: "$form.firstName + ' ' + $form.lastName" },
                },
              },
            },
          ],
        }),
      });

      cy.get('.gui-alert [role="alert"]').contains('Hello, Jane Doe!');
    });

    it('should evaluate arithmetic expression params in i18n translations', () => {
      i18next.addResourceBundle('en', 'translation', { 'item.count': 'Items: {{n}}' }, true, true);

      mountFn({
        localization: i18nTranslator,
        data: { count: 4 },
        formDef: defineForm({
          form: [
            {
              uid: 'items',
              kind: 'display',
              type: 'alert',
              props: {
                text: {
                  key: 'item.count',
                  params: { n: '$form.count + 1' },
                },
              },
            },
          ],
        }),
      });

      cy.get('.gui-alert [role="alert"]').contains('Items: 5');
    });

    it('should interpolate $errors and $formIsInvalid in i18n translation params', () => {
      i18next.addResourceBundle(
        'en',
        'translation',
        { 'form.status': 'Errors: {{fieldError}}, Invalid: {{isInvalid}}' },
        true,
        true,
      );

      mountFn({
        localization: i18nTranslator,
        formDef: defineForm({
          form: [
            {
              uid: 'userName',
              kind: 'input',
              type: 'textinput',
              path: 'userName',
              validator: { type: 'string', required: true },
            },
            {
              uid: 'submitBtn',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
            {
              uid: 'status-display',
              kind: 'display',
              type: 'alert',
              props: {
                text: {
                  key: 'form.status',
                  params: {
                    fieldError: '$errors.userName',
                    isInvalid: '$formIsInvalid',
                  },
                },
              },
            },
          ],
        }),
      });

      // Before submit: $formIsInvalid is false
      cy.get('.gui-alert [role="alert"]').contains('Invalid: false');

      // After submit with empty required field: errors populate
      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('.gui-alert [role="alert"]').contains(
        'Errors: Invalid input: expected string, received undefined, Invalid: true',
      );
    });

    it('should emit formHealth error when an i18n param expression is invalid', () => {
      mountFn({
        localization: i18nTranslator,
        formDef: defineForm({
          form: [
            {
              uid: 'greeting',
              kind: 'display',
              type: 'alert',
              props: {
                text: {
                  key: 'user.name.label',
                  params: { name: '$form..broken' },
                },
              },
            },
          ],
        }),
      });

      cy.get('@formHealth').should('have.been.calledWithMatch', {
        status: 'errored',
        code: 40,
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle zero and false values in i18n params interpolation', () => {
      i18next.addResourceBundle(
        'en',
        'translation',
        {
          stats: 'Count: {{count}}, Active: {{isActive}}',
        },
        true,
        true,
      );

      mountFn({
        localization: i18nTranslator,
        data: { count: 0, isActive: false },
        formDef: defineForm({
          form: [
            {
              uid: 'stats',
              kind: 'display',
              type: 'alert',
              props: {
                text: {
                  key: 'stats',
                  params: {
                    count: '$form.count',
                    isActive: '$form.isActive',
                  },
                },
              },
            },
          ],
        }),
      });

      cy.get('.gui-alert [role="alert"]').contains('Count: 0, Active: false');
    });
  });

  describe('identityTranslator', () => {
    it('should update the form direction to rtl when setLang is called with an rtl language', () => {
      const translator = identityTranslator('en-US');

      mountFn({
        localization: translator,
        formDef: defineForm({
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
      const translator = identityTranslator('en-US');

      cy.clock(new Date(2024, 1, 15).getTime()); // February 15, 2024

      mountFn({
        localization: translator,
        formDef: defineForm({
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
