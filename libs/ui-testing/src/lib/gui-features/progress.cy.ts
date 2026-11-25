import { defineForm, identityTranslator } from '@golemui/core';
import { dictionaryTranslator, type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the progress widget: a labelled bar, indeterminate without a value.
export const runProgressComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  const bar = (uid: string) => cy.get(`[data-cy="${uid}_progress"]`);
  const shownValue = (uid: string) =>
    cy.get(`.gui-progress:has([data-cy="${uid}_progress"]) .gui-progress__value`);

  describe('Progress Component', () => {
    it('renders a labelled bar with its value and its percentage', () => {
      mountFn({
        localization: identityTranslator('en-US'),
        formDef: defineForm({
          form: [
            {
              uid: 'profile',
              kind: 'display',
              type: 'progress',
              props: { label: 'Profile', value: 40, showValue: true },
            },
          ],
        }),
      });

      bar('profile')
        .should('have.prop', 'value', 40)
        .and('have.prop', 'max', 100)
        .and(([el]) =>
          expect((el as HTMLProgressElement).labels[0]?.textContent).to.contain('Profile'),
        );
      shownValue('profile').should('have.text', '40%');
    });

    it('is indeterminate without a value, and shows no percentage', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'upload',
              kind: 'display',
              type: 'progress',
              props: { label: 'Uploading', showValue: true },
            },
          ],
        }),
      });

      bar('upload').should('not.have.attr', 'value');
      bar('upload').should(([el]) => expect((el as HTMLProgressElement).position).to.equal(-1));
      shownValue('upload').should('not.exist');
    });

    it('takes its maximum, and the value of the active state', () => {
      mountFn({
        localization: identityTranslator('en-US'),
        formDef: defineForm({
          states: { step2: '$form.step === 2' },
          form: [
            { uid: 'step', kind: 'input', type: 'number', path: 'step' },
            {
              uid: 'checkout',
              kind: 'display',
              type: 'progress',
              props: { label: 'Checkout', value: 1, 'value.step2': 2, max: 4, showValue: true },
            },
          ],
        }),
      });

      bar('checkout').should('have.prop', 'max', 4).and('have.prop', 'value', 1);
      shownValue('checkout').should('have.text', '25%');
      cy.get('[data-cy="step_number"]').type('2').blur();
      bar('checkout').should('have.prop', 'value', 2);
      shownValue('checkout').should('have.text', '50%');
    });

    it('formats its percentage and translates its label in the form language', () => {
      const translator = dictionaryTranslator('en-US', {
        'en-US': { 'profile.progress': 'Profile' },
        'de-DE': { 'profile.progress': 'Profil' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'profile',
              kind: 'display',
              type: 'progress',
              props: { label: { key: 'profile.progress' }, value: 40, showValue: true },
            },
          ],
        }),
      });

      shownValue('profile').should('have.text', '40%');
      cy.then(() => translator.setLang('de-DE'));
      bar('profile').should(([el]) =>
        expect((el as HTMLProgressElement).labels[0]?.textContent).to.contain('Profil'),
      );
      // German puts a no-break space before the percent sign.
      shownValue('profile').should('have.text', '40 %');
    });
  });
};
