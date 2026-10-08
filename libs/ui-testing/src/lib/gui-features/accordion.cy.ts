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

    it('gives every header and region an id built from the accordion uid', () => {
      ['firstSection', 'secondSection'].forEach((sectionUid) => {
        cy.get(`summary[id="accordion_button_${ACCORDION_UID}_${sectionUid}"]`).should('exist');
        cy.get(`[id="accordion_section_${ACCORDION_UID}_${sectionUid}"]`).should(
          'have.attr',
          'aria-labelledby',
          `accordion_button_${ACCORDION_UID}_${sectionUid}`,
        );
      });

      expectNoDuplicateIds();
    });

    it('toggles the section of the clicked header', () => {
      cy.get(`[id="accordion_button_${ACCORDION_UID}_secondSection"]`)
        .parent('details')
        .should('not.have.attr', 'open');
      cy.get(`[id="accordion_button_${ACCORDION_UID}_secondSection"]`).click();
      cy.get(`[id="accordion_button_${ACCORDION_UID}_secondSection"]`)
        .parent('details')
        .should('have.attr', 'open');
      cy.get(`[id="accordion_section_${ACCORDION_UID}_secondSection"]`).should('be.visible');
      cy.get('[data-cy="secondSection_textinput"]').should('be.visible');
    });
  });

  describe('Accordion Component with singleOpen', () => {
    const ACCORDION_UID = 'singleOpenAccordion';
    const header = (sectionUid: string) =>
      cy.get(`[id="accordion_button_${ACCORDION_UID}_${sectionUid}"]`);

    it('closes the open section when another one opens, and emits one change', () => {
      const formEventHandler = cy.stub().as('formEventHandler');

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: ACCORDION_UID,
              kind: 'layout',
              type: 'accordion',
              on: { change: 'sectionsChanged' },
              props: {
                singleOpen: true,
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
        formEvent: formEventHandler,
      });

      const changes = () =>
        formEventHandler
          .getCalls()
          .filter((call) => call.args[0].name === 'sectionsChanged')
          .map((call) => call.args[0].detail);

      header('firstSection').parent('details').should('have.attr', 'open');
      header('secondSection').click();

      header('secondSection').parent('details').should('have.attr', 'open');
      header('firstSection').parent('details').should('not.have.attr', 'open');
      // gui-accordion fires the close of the first section in a microtask, before this check runs:
      // a handler that reads stale sections emits a second change here.
      cy.get('@formEventHandler').should(() => {
        expect(changes()).to.deep.equal([{ firstSection: false, secondSection: true }]);
      });
    });
  });

  describe('Accordion Component with calculated props', () => {
    const ACCORDION_UID = 'calculatedAccordion';

    it('reads singleOpen from the calculated props when a property function produces it', () => {
      // The raw prop value is the function itself (truthy), only the calculated props hold `false`
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: ACCORDION_UID,
              kind: 'layout',
              type: 'accordion',
              props: {
                singleOpen: () => false,
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

      cy.get(`[id="accordion_button_${ACCORDION_UID}_secondSection"]`).click();

      // singleOpen is false, so opening the second section keeps the first one open
      cy.get(`[id="accordion_section_${ACCORDION_UID}_secondSection"]`).should('be.visible');
      cy.get(`[id="accordion_section_${ACCORDION_UID}_firstSection"]`).should('be.visible');
    });
  });
};
