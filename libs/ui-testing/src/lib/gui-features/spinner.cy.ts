import { defineForm } from '@golemui/core';
import { dictionaryTranslator, type MountComponentFn, testDomId, withTestFormName } from '../utils';

// Behavior tests for the spinner widget: shown while a state holds, its label in a status region.
export const runSpinnerComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  const spinner = (uid: string) => cy.get(`gui-spinner[id="${testDomId(uid)}"]`);

  describe('Spinner Component', () => {
    it('puts its label in a status region', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'wait',
              kind: 'display',
              type: 'spinner',
              props: { label: 'Loading results' },
            },
          ],
        }),
      });

      spinner('wait').find('[role="status"]').should('have.text', 'Loading results');
      spinner('wait').parent().should('have.class', 'gui-spinner').and('have.class', 'gui-field');
    });

    it('is decorative without a label', () => {
      mountFn({
        formDef: defineForm({ form: [{ uid: 'wait', kind: 'display', type: 'spinner' }] }),
      });

      spinner('wait').find('[role="status"]').should('have.text', '');
    });

    it('shows only while its state holds', () => {
      mountFn({
        formDef: defineForm({
          states: { loading: '$form.loading === true' },
          form: [
            { uid: 'loading', kind: 'input', type: 'toggle', path: 'loading', label: 'Loading' },
            {
              uid: 'wait',
              kind: 'display',
              type: 'spinner',
              include: { in: ['loading'] },
              props: { label: 'Loading results' },
            },
          ],
        }),
      });

      spinner('wait').should('not.exist');
      cy.get('[data-cy="loading_toggle"]').click();
      spinner('wait').should('exist');
      cy.get('[data-cy="loading_toggle"]').click();
      spinner('wait').should('not.exist');
    });

    it('translates its label, and again after a language change', () => {
      const translator = dictionaryTranslator('en', {
        en: { 'results.loading': 'Loading results' },
        es: { 'results.loading': 'Cargando resultados' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'wait',
              kind: 'display',
              type: 'spinner',
              props: { label: { key: 'results.loading' } },
            },
          ],
        }),
      });

      spinner('wait').find('[role="status"]').should('have.text', 'Loading results');
      cy.then(() => translator.setLang('es'));
      spinner('wait').find('[role="status"]').should('have.text', 'Cargando resultados');
    });
  });
};
