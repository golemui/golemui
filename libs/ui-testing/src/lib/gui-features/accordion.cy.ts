import { defineForm } from '@golemui/core';
import {
  dictionaryTranslator,
  eventsNamed,
  expectNoDuplicateIds,
  type MountComponentFn,
} from '../utils';

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

  describe('Accordion Component with translated labels', () => {
    it('translates a section label given as a translation config, again when the language changes', () => {
      const ACCORDION_UID = 'translatedAccordion';
      const sectionLabel = (sectionUid: string) =>
        cy
          .get(`summary[id="accordion_button_${ACCORDION_UID}_${sectionUid}"]`)
          .invoke('text')
          .invoke('trim');
      const translator = dictionaryTranslator('en', {
        en: { 'sections.billing': 'Billing' },
        es: { 'sections.billing': 'Facturación' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: ACCORDION_UID,
              kind: 'layout',
              type: 'accordion',
              props: {
                sections: [
                  { uid: 'billing', label: { key: 'sections.billing' } },
                  { uid: 'shipping', label: { key: 'sections.missing', default: 'Shipping' } },
                  { uid: 'notes', label: 'Notes' },
                ],
              },
              children: [
                { uid: 'billing', kind: 'input', type: 'textinput', path: 'billing', label: 'A' },
                { uid: 'shipping', kind: 'input', type: 'textinput', path: 'shipping', label: 'B' },
                { uid: 'notes', kind: 'input', type: 'textinput', path: 'notes', label: 'C' },
              ],
            },
          ],
        }),
      });

      sectionLabel('billing').should('equal', 'Billing');
      sectionLabel('shipping').should('equal', 'Shipping');
      sectionLabel('notes').should('equal', 'Notes');

      cy.then(() => translator.setLang('es'));
      sectionLabel('billing').should('equal', 'Facturación');
      sectionLabel('notes').should('equal', 'Notes');
    });
  });

  describe('Accordion Component sections at runtime', () => {
    const ACCORDION_UID = 'runtimeAccordion';
    const header = (sectionUid: string) =>
      cy.get(`summary[id="accordion_button_${ACCORDION_UID}_${sectionUid}"]`);
    const details = (sectionUid: string) => header(sectionUid).parent('details');
    const region = (sectionUid: string) =>
      cy.get(`[id="accordion_section_${ACCORDION_UID}_${sectionUid}"]`);
    const input = (uid: string) => cy.get(`[data-cy="${uid}_textinput"]`);
    // Cypress does not treat the content of a closed details element as hidden, the browser does.
    const expectHidden = ($input: JQuery<HTMLElement>) => {
      expect($input[0].checkVisibility(), 'input visibility').to.equal(false);
    };

    // The `show` input outside the accordion controls the `include.when` of the accordion or of a
    // section child.
    const getFormDefinition = ({
      renderMode,
      accordionInclude,
      thirdSectionInclude,
    }: {
      renderMode?: 'all' | 'activeOnly';
      accordionInclude?: { when: string };
      thirdSectionInclude?: { when: string };
    } = {}) =>
      defineForm({
        form: [
          { uid: 'show', kind: 'input', type: 'textinput', path: 'show', label: 'Show' },
          {
            uid: ACCORDION_UID,
            kind: 'layout',
            type: 'accordion',
            on: { change: 'sectionsChanged' },
            ...(accordionInclude ? { include: accordionInclude } : {}),
            props: {
              ...(renderMode ? { renderMode } : {}),
              defaultOpen: { firstSection: true },
              sections: [
                { uid: 'firstSection', label: 'First' },
                { uid: 'secondSection', label: 'Second' },
                { uid: 'thirdSection', label: 'Third' },
              ],
            },
            children: [
              {
                uid: 'firstSection',
                kind: 'input',
                type: 'textinput',
                path: 'first',
                label: 'First',
              },
              {
                uid: 'secondSection',
                kind: 'input',
                type: 'textinput',
                path: 'second',
                label: 'Second',
              },
              {
                uid: 'thirdSection',
                kind: 'input',
                type: 'textinput',
                path: 'third',
                label: 'Third',
                ...(thirdSectionInclude ? { include: thirdSectionInclude } : {}),
              },
            ],
          },
        ],
      });

    it('keeps the input node of a closed section in all mode', () => {
      mountFn({ formDef: getFormDefinition({ renderMode: 'all' }) });

      // A section that was never opened has its input too.
      details('secondSection').should('not.have.attr', 'open');
      input('secondSection').should(expectHidden);

      let firstInput!: HTMLElement;
      input('firstSection').type('Ann');
      input('firstSection').then(($input) => {
        firstInput = $input[0];
      });

      header('firstSection').click();
      details('firstSection').should('not.have.attr', 'open');
      input('firstSection')
        .should(expectHidden)
        .and(($input) => {
          expect($input[0], 'first input node').to.equal(firstInput);
        });

      header('firstSection').click();
      details('firstSection').should('have.attr', 'open');
      input('firstSection')
        .should('be.visible')
        .and('have.value', 'Ann')
        .and(($input) => {
          expect($input[0], 'first input node').to.equal(firstInput);
        });
    });

    it('removes a closed section in activeOnly mode and shows the stored value again', () => {
      mountFn({ formDef: getFormDefinition({ renderMode: 'activeOnly' }) });

      input('firstSection').should('be.visible');
      input('secondSection').should('not.exist');
      input('firstSection').type('Ann');

      header('firstSection').click();
      details('firstSection').should('not.have.attr', 'open');
      input('firstSection').should('not.exist');
      region('firstSection').should('not.exist');

      header('firstSection').click();
      input('firstSection').should('be.visible').and('have.value', 'Ann');
    });

    it('adds and removes the section of a child that is shown and hidden at runtime', () => {
      mountFn({
        formDef: getFormDefinition({ thirdSectionInclude: { when: '$form.show === "yes"' } }),
      });

      header('thirdSection').should('exist');
      region('thirdSection').should('not.exist');

      input('show').type('yes');
      region('thirdSection').should(
        'have.attr',
        'aria-labelledby',
        `accordion_button_${ACCORDION_UID}_thirdSection`,
      );
      header('thirdSection').click();
      input('thirdSection').should('be.visible');

      input('show').clear();
      region('thirdSection').should('not.exist');
      header('thirdSection').should('exist');

      // The accordion stays mounted, so the section is still open when its child comes back.
      input('show').type('yes');
      details('thirdSection').should('have.attr', 'open');
      input('thirdSection').should('be.visible');
    });

    it('opens the default sections again when the hidden accordion is shown again', () => {
      mountFn({
        data: { show: 'yes' },
        formDef: getFormDefinition({ accordionInclude: { when: '$form.show === "yes"' } }),
      });

      header('secondSection').click();
      header('firstSection').click();
      details('secondSection').should('have.attr', 'open');
      details('firstSection').should('not.have.attr', 'open');
      input('secondSection').type('Bob');

      input('show').clear();
      header('firstSection').should('not.exist');

      input('show').type('yes');
      // The layout mounts again, so it starts from defaultOpen. The store keeps the value.
      details('firstSection').should('have.attr', 'open');
      details('secondSection').should('not.have.attr', 'open');
      input('secondSection').should('have.value', 'Bob');
    });

    it('emits every open section in the change event when more than one can be open', () => {
      const formEventHandler = cy.stub().as('formEventHandler');
      mountFn({ formDef: getFormDefinition(), formEvent: formEventHandler });

      header('secondSection').click();
      details('secondSection').should('have.attr', 'open');
      header('firstSection').click();
      details('firstSection').should('not.have.attr', 'open');

      cy.get('@formEventHandler').should(() => {
        expect(
          eventsNamed(formEventHandler, 'sectionsChanged').map((event) => event.detail),
        ).to.deep.equal([
          { firstSection: true, secondSection: true },
          { firstSection: false, secondSection: true },
        ]);
      });
    });
  });
};
