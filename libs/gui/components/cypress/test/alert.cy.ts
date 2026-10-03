import { html } from 'lit';
import { checkA11y } from '../support/a11y';

const alert = () => cy.get('gui-alert');

describe('gui-alert', () => {
  it('shows its children as an alert, styled by variant', () => {
    cy.mount(html`<gui-alert variant="warning">Some fields need your attention.</gui-alert>`);

    alert()
      .should('have.attr', 'role', 'alert')
      .and('have.attr', 'variant', 'warning')
      .and('contain.text', 'Some fields need your attention.');
    alert().should(([element]) => {
      const style = getComputedStyle(element);
      expect(style.backgroundColor).to.not.equal(getComputedStyle(document.body).backgroundColor);
    });
  });

  it('keeps a role the app gives it', () => {
    cy.mount(html`<gui-alert role="status">Saved.</gui-alert>`);

    alert().should('have.attr', 'role', 'status');
  });

  it('has no accessibility violations', () => {
    cy.mount(html`<gui-alert variant="error">The upload failed.</gui-alert>`);

    checkA11y('gui-alert');
  });
});
