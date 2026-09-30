import { html } from 'lit';

const button = () => cy.get('gui-button button');

describe('gui-button', () => {
  describe('rendering', () => {
    it('renders its label in a plain button', () => {
      cy.mount(html`<gui-button label="Save"></gui-button>`);

      button().should('have.attr', 'type', 'button').and('contain.text', 'Save');
      button().should('not.have.class', 'gui-button--outlined');
    });

    it('renders its icon hidden from assistive technology, on the side of icon-position', () => {
      cy.mount(
        html`<gui-button label="Next" icon="icon-arrow" icon-position="right"></gui-button>`,
      );

      button()
        .should('have.class', 'gui-button-with-icon')
        .and('have.class', 'gui-button-icon-right');
      button()
        .children()
        .last()
        .should('have.class', 'icon-arrow')
        .and('have.attr', 'aria-hidden', 'true');

      cy.get('gui-button').invoke('attr', 'icon-position', 'left');
      button().children().first().should('have.class', 'icon-arrow');
    });

    it('styles itself with variant', () => {
      cy.mount(html`<gui-button label="Cancel" variant="outlined"></gui-button>`);

      button().should('have.class', 'gui-button--outlined');
      cy.get('gui-button').invoke('attr', 'variant', 'link');
      button()
        .should('have.class', 'gui-button--link')
        .and('not.have.class', 'gui-button--outlined');
    });
  });

  describe('states', () => {
    it('submits its form with action-type="submit"', () => {
      const onSubmit = cy.spy((event: Event) => event.preventDefault()).as('submit');
      cy.mount(
        html`<form @submit=${onSubmit}>
          <gui-button label="Send" action-type="submit"></gui-button>
        </form>`,
      );

      button().should('have.attr', 'type', 'submit').click();

      cy.get('@submit').should('have.been.calledOnce');
    });

    it('marks a submit button blocked by an invalid form', () => {
      cy.mount(html`<gui-button label="Send" action-type="submit" invalid></gui-button>`);

      button().should('have.class', 'gui-button--invalid');
      cy.get('gui-button').invoke('attr', 'action-type', 'button');
      button().should('not.have.class', 'gui-button--invalid');
    });

    it('disables the native button', () => {
      cy.mount(html`<gui-button label="Save" disabled></gui-button>`);

      button().should('be.disabled');
    });
  });
});
