import { html } from 'lit';
import { checkA11y } from '../support/a11y';

const item = (index: number) => cy.get('gui-accordion-item').eq(index);
const details = (index: number) => item(index).find('details');
const summary = (index: number) => item(index).find('summary');

// The caret is CSS, drawn on the app's summary (`summary::after`): no element of its own.
const caretOf = (summary: HTMLElement) =>
  summary.ownerDocument.defaultView!.getComputedStyle(summary, '::after');

const profile = (multiple = false) =>
  html`<gui-accordion ?multiple=${multiple}>
    <gui-accordion-item>
      <details open>
        <summary>Personal</summary>
        <div>Personal details</div>
      </details>
    </gui-accordion-item>
    <gui-accordion-item>
      <details>
        <summary>Billing</summary>
        <div>Billing details</div>
      </details>
    </gui-accordion-item>
  </gui-accordion>`;

describe('gui-accordion', () => {
  describe('rendering', () => {
    it('takes the open state of its details, and draws the caret on each summary', () => {
      cy.mount(profile());

      item(0).should('have.prop', 'open', true);
      item(1).should('have.prop', 'open', false);
      summary(0).should(([element]) => {
        const caret = caretOf(element);
        expect(caret.content).to.equal('""');
        expect(caret.width).to.equal('16px');
        expect(caret.rotate).to.equal('180deg');
      });
      summary(1).should(([element]) => {
        expect(caretOf(element).content).to.equal('""');
        expect(caretOf(element).rotate).not.to.equal('180deg');
      });
    });

    it('opens and closes its details with open', () => {
      cy.mount(profile());

      item(1).invoke('prop', 'open', true);
      details(1).should('have.attr', 'open');
      item(1).invoke('prop', 'open', false);
      details(1).should('not.have.attr', 'open');
    });

    it('keeps the caret on a summary the app re-renders', () => {
      cy.mount(profile());

      summary(0).then(([element]) => {
        element.textContent = 'Personal data';
      });

      summary(0)
        .should('contain.text', 'Personal data')
        .should(([element]) => expect(caretOf(element).content).to.equal('""'));
    });

    it('has no accessibility violations', () => {
      cy.mount(profile());

      checkA11y('gui-accordion');
    });
  });

  describe('toggling', () => {
    it('fires gui-toggle when the user opens or closes an item', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${profile(true)}</div>`);

      summary(1).click();
      details(1).should('have.attr', 'open');
      item(1).should('have.prop', 'open', true);
      cy.get('@toggle').should('have.been.calledOnce');
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: true });

      summary(1).click();
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: false });
    });

    it('fires nothing when the app sets open', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${profile(true)}</div>`);

      item(1).invoke('prop', 'open', true);
      details(1).should('have.attr', 'open');

      cy.get('@toggle').should('not.have.been.called');
    });

    it('closes the other items when one opens, and reports them after it', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${profile()}</div>`);

      summary(1).click();

      details(1).should('have.attr', 'open');
      details(0).should('not.have.attr', 'open');
      cy.get('@toggle').should('have.been.calledTwice');
      cy.get('@toggle').then((spy) => {
        const calls = (spy as unknown as sinon.SinonSpy).getCalls();
        expect(calls.map((call) => call.args[0].detail.open)).to.deep.equal([true, false]);
        expect(calls[1].args[0].target).to.equal(Cypress.$('gui-accordion-item')[0]);
      });
    });

    it('keeps several items open with multiple', () => {
      cy.mount(profile(true));

      summary(1).click();

      details(0).should('have.attr', 'open');
      details(1).should('have.attr', 'open');
    });
  });
});
