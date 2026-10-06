import { html } from 'lit';
import type { GuiCurrency } from '../../src/lib/components/currency';

const input = () => cy.get('gui-currency input');
const formatted = () => cy.get('gui-currency .gui-currency__format-value');
const element = () => cy.get<GuiCurrency>('gui-currency');

describe('gui-currency', () => {
  describe('rendering', () => {
    it('renders its attributes on the native input', () => {
      cy.mount(
        html`<gui-currency
          label="Price"
          value="12.5"
          step="0.5"
          placeholder="0.00"
          autocomplete="off"
          required
        ></gui-currency>`,
      );

      input()
        .should('have.value', '12.5')
        .and('have.attr', 'type', 'number')
        .and('have.attr', 'step', 'any')
        .and('have.attr', 'placeholder', '0.00')
        .and('have.attr', 'autocomplete', 'off');
      // The element validates itself: only the ARIA state is on the native control.
      input().should('have.attr', 'aria-required', 'true').and('not.have.attr', 'required');
      cy.get('gui-currency label').should('contain.text', 'Price');
    });

    it('formats the amount in its currency and locale, hidden from assistive technology', () => {
      cy.mount(
        html`<gui-currency
          label="Price"
          value="1234.5"
          currency="EUR"
          locale-id="de-DE"
        ></gui-currency>`,
      );

      formatted().should('have.text', '1.234,50\u00a0€').and('have.attr', 'aria-hidden', 'true');
    });

    it('formats in US dollars by default', () => {
      cy.mount(html`<gui-currency label="Price" value="1234.5"></gui-currency>`);

      formatted().should('have.text', '$1,234.50');
    });

    it('formats with maximum-fraction-digits and minimum-fraction-digits', () => {
      cy.mount(
        html`<gui-currency label="Price" value="1234" maximum-fraction-digits="0"></gui-currency>
          <gui-currency label="Cost" value="12.5" minimum-fraction-digits="3"></gui-currency>`,
      );

      formatted().first().should('have.text', '$1,234');
      formatted().last().should('have.text', '$12.500');
    });

    it('describes the input with its hint and points it at its errors', () => {
      cy.mount(
        html`<gui-currency label="Price" hint="Before tax" .errors=${['Too high']}></gui-currency>`,
      );

      input()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Before tax'));
      input().should('have.attr', 'aria-invalid', 'true');
      input()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Too high'));
    });

    it('renders its icon hidden from assistive technology', () => {
      cy.mount(html`<gui-currency label="Price" icon="icon-money"></gui-currency>`);

      cy.get('gui-currency .icon-money').should('have.attr', 'aria-hidden', 'true');
    });
  });

  describe('value', () => {
    it('fires gui-input with the number on every keystroke and gui-change on Enter', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-currency
          label="Price"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-currency>`,
      );

      input().type('9.99{enter}');

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 9.99 });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 9.99 });
      element().should('have.prop', 'value', 9.99);
    });

    it('fires gui-change and gui-blur when focus leaves, and formats the amount', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-currency
          label="Price"
          @gui-change=${onChange}
          @gui-blur=${onBlur}
        ></gui-currency>`,
      );

      input().type('1234.5').blur();

      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 1234.5 });
      cy.get('@blur').should('have.been.calledOnce');
      formatted().should('have.text', '$1,234.50');
    });

    it('reads its number attributes as numbers', () => {
      cy.mount(
        html`<gui-currency
          label="Price"
          value="12.5"
          step="0.5"
          maximum-fraction-digits="3"
          minimum-fraction-digits="1"
        ></gui-currency>`,
      );

      element()
        .should('have.prop', 'value', 12.5)
        .and('have.prop', 'step', 0.5)
        .and('have.prop', 'maximumFractionDigits', 3)
        .and('have.prop', 'minimumFractionDigits', 1);
      formatted().should('have.text', '$12.5');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-currency label="Price" value="12.5"></gui-currency>`);

      element().invoke('prop', 'value', 99);

      input().should('have.value', '99');
      formatted().should('have.text', '$99.00');
    });

    it('blocks letters', () => {
      cy.mount(html`<gui-currency label="Price"></gui-currency>`);

      input().type('a1b2');

      input().should('have.value', '12');
    });
  });

  describe('states', () => {
    it('makes the native input read-only', () => {
      cy.mount(html`<gui-currency label="Price" value="12.5" readonly></gui-currency>`);

      input().should('have.attr', 'readonly');
      input().should('have.attr', 'aria-readonly', 'true');
      input().focus().should('be.focused').and('have.value', '12.5');
    });

    it('disables the native input', () => {
      cy.mount(html`<gui-currency label="Price" disabled></gui-currency>`);

      input().should('be.disabled');
    });
  });
});
