import { defineForm } from '@golemui/core';
import { mountFramework } from '../../support/mount';

// Lit-local: the two load paths of a widget leave a different DOM, and only Lit has a wrapper
// element for each widget. The custom heading gets new loader functions on each mount, so a
// preload in one test does not change the path of the heading in the other test. The loaded
// components of the gui widgets, the root grid included, stay loaded for the next tests.
const headingForm = defineForm({
  form: [{ uid: 'title', kind: 'display', type: 'heading', props: { text: 'Hello', level: 2 } }],
});

describe('Lit widget load paths', () => {
  it('replaces the gui-widget element with the widget element after a dynamic import', () => {
    mountFramework({ withCustomComponent: true, formDef: headingForm });

    cy.get('app-heading').should('have.id', 'host-title');
    cy.get('app-heading').parent().should('not.match', 'gui-widget');
  });

  it('keeps the gui-widget element with display contents when the widget was preloaded', () => {
    mountFramework({ withCustomComponent: true, preloadWidgets: true, formDef: headingForm });

    cy.get('app-heading').should('have.id', 'host-title');
    cy.get('app-heading').parent().should('match', 'gui-widget');
    // One for the root layout of the form and one for the heading.
    cy.get('gui-widget').should('have.length', 2);
    cy.get('gui-widget').each((wrapper) => expect(wrapper).to.have.css('display', 'contents'));
  });
});
