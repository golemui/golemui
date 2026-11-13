import { html } from 'lit';
import type { GuiBadge } from '../../src/lib/components/badge';
import { checkA11y } from '../support/a11y';

const badge = () => cy.get<GuiBadge>('gui-badge');

describe('gui-badge', () => {
  it('shows its children, styled by variant', () => {
    cy.mount(html`<p>Invoice 42 <gui-badge variant="success">Paid</gui-badge></p>`);

    badge().should('contain.text', 'Paid').and('have.attr', 'variant', 'success');
    badge().should(([element]) => {
      const style = getComputedStyle(element);
      expect(style.display).to.equal('inline-flex');
      expect(style.backgroundColor).to.not.equal(getComputedStyle(document.body).backgroundColor);
    });
  });

  it('is neutral without a variant, and adds nothing to the markup of the app', () => {
    cy.mount(html`<gui-badge>Draft</gui-badge>`);

    badge().should(([element]) => {
      expect(element.getAttributeNames()).to.deep.equal([]);
      expect(element.hasAttribute('role')).to.equal(false);
    });
  });

  it('reflects a variant set as a property, for the stylesheet', () => {
    cy.mount(html`<gui-badge>Late</gui-badge>`);

    badge().invoke('prop', 'variant', 'error');
    badge().should('have.attr', 'variant', 'error');
  });

  it('has no accessibility violations in any variant', () => {
    cy.mount(
      html`<p>
        <gui-badge>Draft</gui-badge>
        <gui-badge variant="info">New</gui-badge>
        <gui-badge variant="success">Paid</gui-badge>
        <gui-badge variant="warning">Due soon</gui-badge>
        <gui-badge variant="error">Overdue</gui-badge>
      </p>`,
    );

    checkA11y('p');
  });
});
