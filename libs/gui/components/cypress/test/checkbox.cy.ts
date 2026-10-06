import { html } from 'lit';
import type { GuiCheckbox } from '../../src/lib/components/checkbox';

const input = () => cy.get('gui-checkbox input');
const element = () => cy.get<GuiCheckbox>('gui-checkbox');

describe('gui-checkbox', () => {
  describe('rendering', () => {
    it('renders its label and describes the checkbox with its hint', () => {
      cy.mount(html`<gui-checkbox label="I agree" hint="Read the terms first"></gui-checkbox>`);

      input().should('have.attr', 'type', 'checkbox').and('not.be.checked');
      cy.get('gui-checkbox label').should('contain.text', 'I agree');
      input()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Read the terms first'));
    });

    it('places the checkbox on the right with checkbox-position', () => {
      cy.mount(html`<gui-checkbox label="I agree" checkbox-position="right"></gui-checkbox>`);

      element().should('have.class', 'gui-checkbox--right');
      element().invoke('prop', 'checkboxPosition', 'left');
      element().should('not.have.class', 'gui-checkbox--right');
    });

    it('marks the checkbox as required', () => {
      cy.mount(html`<gui-checkbox label="I agree" required></gui-checkbox>`);

      input().should('not.have.attr', 'required');
      input().should('have.attr', 'aria-required', 'true');
      cy.get('gui-checkbox label [aria-hidden="true"]').should('contain.text', '*');
    });

    it('shows its errors and points the checkbox at them', () => {
      cy.mount(html`<gui-checkbox label="I agree" .errors=${['You must agree']}></gui-checkbox>`);

      input().should('have.attr', 'aria-invalid', 'true');
      input()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'You must agree'));
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when checked', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-checkbox
          label="I agree"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-checkbox>`,
      );

      input().check();

      cy.get('@input').should('have.been.calledOnce');
      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: true });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: true });
      element().should('have.prop', 'value', true);
    });

    it('fires gui-change with false when unchecked', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-checkbox label="I agree" .value=${true} @gui-change=${onChange}></gui-checkbox>`,
      );

      input().should('be.checked').uncheck();

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: false });
      element().should('have.prop', 'value', false);
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(html`<gui-checkbox label="I agree" @gui-blur=${onBlur}></gui-checkbox>`);

      input().focus().blur();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('reads its value attribute as a boolean, and value="false" as unchecked', () => {
      cy.mount(
        html`<gui-checkbox label="On" value></gui-checkbox>
          <gui-checkbox label="Off" value="false"></gui-checkbox>`,
      );

      element().eq(0).should('have.prop', 'value', true).find('input').should('be.checked');
      element().eq(1).should('have.prop', 'value', false).find('input').should('not.be.checked');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-checkbox label="I agree"></gui-checkbox>`);

      element().invoke('prop', 'value', true);
      input().should('be.checked');

      element().invoke('prop', 'value', false);
      input().should('not.be.checked');
    });
  });

  describe('states', () => {
    it('stays focusable and marked read-only when read-only', () => {
      cy.mount(html`<gui-checkbox label="I agree" readonly></gui-checkbox>`);

      input()
        .should('not.be.disabled')
        .and('have.attr', 'aria-readonly', 'true')
        .and('have.css', 'cursor', 'default');
      input().focus().should('be.focused');
    });

    it('keeps its value on click when read-only, firing nothing', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-checkbox
          label="I agree"
          readonly
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-checkbox>`,
      );

      cy.get('gui-checkbox label').click();
      input().click();

      input().should('not.be.checked');
      element().should(([el]) => expect(el.value).to.equal(undefined));
      cy.get('@input').should('not.have.been.called');
      cy.get('@change').should('not.have.been.called');
    });

    it('disables the native checkbox', () => {
      cy.mount(html`<gui-checkbox label="I agree" disabled></gui-checkbox>`);

      input().should('be.disabled');
    });
  });
});
