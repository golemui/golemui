import { defineForm, identityTranslator } from '@golemui/core';
import { dictionaryTranslator, type MountComponentFn, testDomId, withTestFormName } from '../utils';

// Behavior tests for the badge widget: a short status label in an alert's intent colors.
export const runBadgeComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  const badge = (uid: string) => cy.get(`gui-badge[id="${testDomId(uid)}"]`);

  describe('Badge Component', () => {
    it('renders its text in the intent of its level', () => {
      mountFn({
        localization: identityTranslator('en-US'),
        formDef: defineForm({
          form: [
            {
              uid: 'paid',
              kind: 'display',
              type: 'badge',
              props: { text: 'Paid', level: 'success' },
            },
          ],
        }),
      });

      badge('paid').should('have.attr', 'variant', 'success').and('have.text', 'Paid');
      badge('paid').parent().should('have.class', 'gui-badge').and('have.class', 'gui-field');
    });

    it('uses the default variant when no level is set', () => {
      mountFn({
        formDef: defineForm({
          form: [{ uid: 'note', kind: 'display', type: 'badge', props: { text: 'Draft' } }],
        }),
      });

      badge('note').should('have.attr', 'variant', 'default');
    });

    it('takes the text and the level of the active state', () => {
      mountFn({
        formDef: defineForm({
          states: { overdue: "$form.status === 'overdue'" },
          form: [
            { uid: 'status', kind: 'input', type: 'textinput', path: 'status' },
            {
              uid: 'invoice',
              kind: 'display',
              type: 'badge',
              props: {
                text: 'Paid',
                level: 'success',
                'text.overdue': 'Payment overdue',
                'level.overdue': 'error',
              },
            },
          ],
        }),
      });

      badge('invoice').should('have.attr', 'variant', 'success').and('have.text', 'Paid');
      cy.get('[data-cy="status_textinput"]').type('overdue');
      badge('invoice').should('have.attr', 'variant', 'error').and('have.text', 'Payment overdue');
    });

    it('interpolates the form data in its text', () => {
      mountFn({
        data: { unread: 3 },
        formDef: defineForm({
          form: [
            {
              uid: 'inbox',
              kind: 'display',
              type: 'badge',
              props: { text: '{{ $form.unread }} new messages', level: 'info' },
            },
          ],
        }),
      });

      badge('inbox').should('have.text', '3 new messages');
    });

    it('translates a text given as a translation key, and again after a language change', () => {
      const translator = dictionaryTranslator('en', {
        en: { 'invoice.paid': 'Paid' },
        es: { 'invoice.paid': 'Pagada' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'paid',
              kind: 'display',
              type: 'badge',
              props: { text: { key: 'invoice.paid' }, level: 'success' },
            },
          ],
        }),
      });

      badge('paid').should('have.text', 'Paid');
      cy.then(() => translator.setLang('es'));
      badge('paid').should('have.text', 'Pagada');
    });
  });
};
