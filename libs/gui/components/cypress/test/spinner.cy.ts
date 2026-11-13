import { html } from 'lit';
import type { GuiSpinner } from '../../src/lib/components/spinner';
import { checkA11y } from '../support/a11y';

const spinner = () => cy.get<GuiSpinner>('gui-spinner');
const status = () => cy.get('gui-spinner [role="status"]');

describe('gui-spinner', () => {
  it('spins a decorative glyph, and puts its label in a status region hidden on screen', () => {
    cy.mount(html`<gui-spinner label="Loading results"></gui-spinner>`);

    cy.get('gui-spinner svg')
      .should('have.attr', 'aria-hidden', 'true')
      .and(([glyph]) => expect(getComputedStyle(glyph).animationName).to.equal('gui-spin'));
    status().should('have.text', 'Loading results').and('have.class', 'gui-visually-hidden');
  });

  it('adds nothing to its own markup: the status is inside it', () => {
    cy.mount(html`<gui-spinner label="Loading results"></gui-spinner>`);

    spinner().should(([element]) => expect(element.getAttributeNames()).to.deep.equal(['label']));
  });

  it('says nothing without a label, and announces one set later', () => {
    cy.mount(html`<gui-spinner></gui-spinner>`);

    status().should('have.text', '');
    spinner().invoke('prop', 'label', 'Saving');
    status().should('have.text', 'Saving');
  });

  it('takes the text color, and its size from --gui-spinner-size', () => {
    cy.mount(
      html`<p style="color: rgb(200, 0, 0); font-size: 20px">
        <gui-spinner></gui-spinner>
        <gui-spinner style="--gui-spinner-size: 40px"></gui-spinner>
      </p>`,
    );

    cy.get('gui-spinner svg').should((glyphs) => {
      expect(getComputedStyle(glyphs[0]).fill).to.equal('rgb(200, 0, 0)');
      expect(glyphs[0].getBoundingClientRect().width).to.equal(25);
      expect(glyphs[1].getBoundingClientRect().width).to.equal(40);
    });
  });

  it('hides with the hidden attribute', () => {
    cy.mount(html`<gui-spinner label="Loading results" hidden></gui-spinner>`);

    spinner().should('not.be.visible');
  });

  it('has no accessibility violations, with a label or without one', () => {
    cy.mount(
      html`<div>
        <gui-spinner label="Loading results"></gui-spinner>
        <gui-spinner></gui-spinner>
      </div>`,
    );

    checkA11y('div');
  });
});
