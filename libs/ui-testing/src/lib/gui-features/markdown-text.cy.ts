import { defineForm } from '@golemui/core';
import { dictionaryTranslator, eventsNamed, type MountComponentFn } from '../utils';

// Wraps the source in a marker element, so a test can read the text the parser received.
const wrappingParser = {
  markdown: { parse: (markdown: string) => `<p class="parsed-markdown">${markdown}</p>` },
};

/**
 * Defines the markdownText display tests for one framework.
 *
 * @param mountFn - Mounts a form in the framework under test.
 */
export const runMarkdownTextComponentTests = (mountFn: MountComponentFn) => {
  describe('MarkdownText Component', () => {
    it('should parse the interpolated md again when the form data changes', () => {
      mountFn({
        dependencies: wrappingParser,
        data: { name: 'Bob' },
        formDef: defineForm({
          form: [
            { uid: 'name', kind: 'input', type: 'textinput', path: 'name' },
            {
              uid: 'hello',
              kind: 'display',
              type: 'markdownText',
              props: { md: 'Hi {{$form.name}}' },
            },
          ],
        }),
      });

      cy.get('[id="hello"] .parsed-markdown').should('have.text', 'Hi Bob');
      cy.get('[data-cy="name_textinput"]').clear();
      cy.get('[data-cy="name_textinput"]').type('Ada');
      cy.get('[id="hello"] .parsed-markdown').should('have.text', 'Hi Ada');
    });

    it('should translate md given as a translation key, and again after a language change', () => {
      const translator = dictionaryTranslator('en', {
        en: { 'welcome.md': 'Welcome' },
        es: { 'welcome.md': 'Bienvenida' },
      });

      mountFn({
        dependencies: wrappingParser,
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'welcome',
              kind: 'display',
              type: 'markdownText',
              props: { md: { key: 'welcome.md' } },
            },
          ],
        }),
      });

      cy.get('[id="welcome"] .parsed-markdown').should('have.text', 'Welcome');
      cy.then(() => translator.setLang('es'));
      cy.get('[id="welcome"] .parsed-markdown').should('have.text', 'Bienvenida');
    });

    it('should render nothing inside the element when no markdown parser is provided', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'noParser',
              kind: 'display',
              type: 'markdownText',
              props: { md: 'Some text' },
            },
          ],
        }),
      });

      cy.get('[id="noParser"] gui-markdown-text').should('exist').and('have.text', '');
    });

    it('should send no form event for on handlers on a markdownText', () => {
      const formEvent = cy.stub().as('formEventHandler');

      mountFn({
        dependencies: wrappingParser,
        formEvent,
        formDef: defineForm({
          form: [
            // The display widget type has no `on`. A JSON form definition can still contain it.
            {
              uid: 'note',
              kind: 'display',
              type: 'markdownText',
              props: { md: 'A note' },
              on: { load: 'noteLoaded', click: 'noteClicked' },
            } as any,
            {
              uid: 'save',
              kind: 'action',
              type: 'button',
              label: 'Save',
              on: { click: 'saveClicked' },
            },
          ],
        }),
      });

      cy.get('[id="note"] .parsed-markdown').click();
      // The button event shows that the click above had time to send an event.
      cy.get('[data-cy="save_button"]').click();
      cy.get('@formEventHandler').should(() => {
        expect(eventsNamed(formEvent, 'saveClicked')).to.have.length(1);
      });
      cy.then(() => {
        const names = formEvent.getCalls().map((call) => call.args[0].name);
        expect(names).to.not.include('noteLoaded');
        expect(names).to.not.include('noteClicked');
      });
      cy.get('@formHealth').should('have.been.calledWith', { status: 'ok' });
      cy.get('@formHealth').should('not.have.been.calledWithMatch', { status: 'errored' });
    });
  });
};
