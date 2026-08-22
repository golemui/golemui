import { defineForm } from '@golemui/core';
import { expectNoDuplicateIds, type MountComponentFn } from '../utils';

export const runAccordionComponentTests = (mountFn: MountComponentFn) => {
  describe('Accordion Component', () => {
    const ACCORDION_UID = 'settingsAccordion';

    beforeEach(() => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: ACCORDION_UID,
              kind: 'layout',
              type: 'accordion',
              props: {
                defaultOpen: { firstSection: true },
                sections: [
                  { uid: 'firstSection', label: 'First' },
                  { uid: 'secondSection', label: 'Second' },
                ],
              },
              children: [
                {
                  uid: 'firstSection',
                  kind: 'input',
                  type: 'textinput',
                  path: 'accordion.first',
                  label: 'First',
                },
                {
                  uid: 'secondSection',
                  kind: 'input',
                  type: 'textinput',
                  path: 'accordion.second',
                  label: 'Second',
                },
              ],
            },
          ],
        }),
      });
    });

    it('gives every button and region an id built from the accordion uid', () => {
      ['firstSection', 'secondSection'].forEach((sectionUid) => {
        cy.get(`[id="accordion_button_${ACCORDION_UID}_${sectionUid}"]`).should(
          'have.attr',
          'aria-controls',
          `accordion_section_${ACCORDION_UID}_${sectionUid}`,
        );
        cy.get(`[id="accordion_section_${ACCORDION_UID}_${sectionUid}"]`).should(
          'have.attr',
          'aria-labelledby',
          `accordion_button_${ACCORDION_UID}_${sectionUid}`,
        );
      });

      expectNoDuplicateIds();
    });

    it('toggles the section the clicked button controls', () => {
      cy.get(`[id="accordion_section_${ACCORDION_UID}_secondSection"]`).should(
        'have.attr',
        'hidden',
      );
      cy.get(`[id="accordion_button_${ACCORDION_UID}_secondSection"]`)
        .should('have.attr', 'aria-expanded', 'false')
        .click();
      cy.get(`[id="accordion_section_${ACCORDION_UID}_secondSection"]`).should(
        'not.have.attr',
        'hidden',
      );
      cy.get('[data-cy="secondSection_textinput"]').should('be.visible');
    });
  });
};
