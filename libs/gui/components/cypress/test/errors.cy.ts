import { html } from 'lit';

const errorItems = () => cy.get('gui-errors .gui-validator__error');

describe('gui-errors', () => {
  describe('rendering', () => {
    it('renders each error from its attribute in an alert', () => {
      cy.mount(html`<gui-errors uid="name" errors='["Required","Too short"]'></gui-errors>`);

      cy.get('gui-errors #name_errors').should('have.attr', 'role', 'alert');
      errorItems().should('have.length', 2);
      errorItems().eq(0).should('have.text', 'Required');
      errorItems().eq(1).should('have.text', 'Too short');
    });

    it('keeps an empty alert in place without errors', () => {
      cy.mount(html`<gui-errors uid="name"></gui-errors>`);

      cy.get('gui-errors #name_errors')
        .should('have.attr', 'role', 'alert')
        .and('have.class', 'gui-validator--empty');
      errorItems().should('not.exist');
    });

    it('holds its errors back while touched is false', () => {
      cy.mount(html`<gui-errors .errors=${['Required']} .touched=${false}></gui-errors>`);

      errorItems().should('not.exist');
      cy.get('gui-errors').invoke('attr', 'touched', '');
      errorItems().should('have.text', 'Required');
    });

    it('renders its errors in a panel hidden from assistive technology', () => {
      cy.mount(html`<gui-errors uid="name" panel .errors=${['Required']}></gui-errors>`);

      cy.get('gui-errors #name_panel_errors')
        .should('have.class', 'gui-validator--panel')
        .and('have.attr', 'aria-hidden', 'true')
        .and('not.have.attr', 'role');
      errorItems().should('have.text', 'Required');
    });
  });

  describe('value', () => {
    it('shows errors set from outside', () => {
      cy.mount(html`<gui-errors .errors=${['Required']}></gui-errors>`);

      cy.get('gui-errors').invoke('prop', 'errors', ['Too short']);

      errorItems().should('have.length', 1).and('have.text', 'Too short');
    });
  });
});
