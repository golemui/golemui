import { html } from 'lit';
import type { GuiPassword } from '../../src/lib/components/password';

const input = () => cy.get('gui-password input');
const toggle = () => cy.get('gui-password .gui-password__toggle');
const element = () => cy.get<GuiPassword>('gui-password');

describe('gui-password', () => {
  describe('rendering', () => {
    it('renders its attributes on a masked native input', () => {
      cy.mount(
        html`<gui-password
          label="Password"
          value="secret"
          placeholder="At least 8 characters"
          autocomplete="current-password"
          required
        ></gui-password>`,
      );

      input()
        .should('have.attr', 'type', 'password')
        .and('have.value', 'secret')
        .and('have.attr', 'placeholder', 'At least 8 characters')
        .and('have.attr', 'autocomplete', 'current-password');
      // The element validates itself: only the ARIA state is on the native control.
      input().should('have.attr', 'aria-required', 'true').and('not.have.attr', 'required');
      cy.get('gui-password label').should('contain.text', 'Password');
    });

    it('describes the input with its hint and points it at its errors', () => {
      cy.mount(
        html`<gui-password
          label="Password"
          hint="Use a passphrase"
          .errors=${['Too short']}
        ></gui-password>`,
      );

      input()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Use a passphrase'));
      input().should('have.attr', 'aria-invalid', 'true');
      input()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Too short'));
    });

    it('renders its icon hidden from assistive technology', () => {
      cy.mount(html`<gui-password label="Password" icon="icon-lock"></gui-password>`);

      cy.get('gui-password .icon-lock').should('have.attr', 'aria-hidden', 'true');
    });
  });

  describe('visibility toggle', () => {
    it('shows and hides the password', () => {
      cy.mount(html`<gui-password label="Password" value="secret"></gui-password>`);

      toggle().should('have.attr', 'aria-label', 'Show password').click();
      input().should('have.attr', 'type', 'text').and('have.value', 'secret');
      toggle().should('have.attr', 'aria-label', 'Hide password').click();
      input().should('have.attr', 'type', 'password');
    });

    it('names the toggle from show-password-label and hide-password-label', () => {
      cy.mount(
        html`<gui-password
          label="Password"
          show-password-label="Mostrar"
          hide-password-label="Ocultar"
        ></gui-password>`,
      );

      toggle().should('have.attr', 'aria-label', 'Mostrar').click();
      toggle().should('have.attr', 'aria-label', 'Ocultar');
    });

    it('shows the icon of what the toggle does: show-password-icon while hidden', () => {
      cy.mount(
        html`<gui-password
          label="Password"
          show-password-icon="icon-eye"
          hide-password-icon="icon-eye-off"
        ></gui-password>`,
      );

      toggle()
        .should('have.class', 'icon-eye')
        .and('not.have.class', 'icon-eye-off')
        .and('have.attr', 'data-icon', 'icon-eye');
      toggle().click();
      toggle()
        .should('have.class', 'icon-eye-off')
        .and('not.have.class', 'icon-eye')
        .and('have.attr', 'data-icon', 'icon-eye-off');
    });

    it('drops the toggle text but keeps its name when icons are set', () => {
      cy.mount(
        html`<gui-password
          label="Password"
          show-password-icon="icon-eye"
          hide-password-icon="icon-eye-off"
        ></gui-password>`,
      );

      toggle().should('have.attr', 'aria-label', 'Show password');
      toggle().find('span').should('not.exist');
    });
  });

  describe('value', () => {
    it('fires gui-input on every keystroke and gui-change on Enter', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-password
          label="Password"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-password>`,
      );

      input().type('abc{enter}');

      cy.get('@input').should('have.callCount', 3);
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 'abc' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'abc' });
      element().should('have.prop', 'value', 'abc');
    });

    it('fires gui-change and gui-blur when focus leaves', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-password
          label="Password"
          @gui-change=${onChange}
          @gui-blur=${onBlur}
        ></gui-password>`,
      );

      input().type('abc').blur();

      cy.get('@change').should('have.been.calledOnce');
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-password label="Password" value="secret"></gui-password>`);

      element().invoke('prop', 'value', 'hunter2');

      input().should('have.value', 'hunter2');
    });
  });

  describe('states', () => {
    it('makes the native input read-only but keeps the toggle', () => {
      cy.mount(html`<gui-password label="Password" value="secret" readonly></gui-password>`);

      input().should('have.attr', 'readonly');
      input().should('have.attr', 'aria-readonly', 'true');
      input().focus().should('be.focused');
      toggle().should('not.be.disabled').click();
      input().should('have.attr', 'type', 'text');
    });

    it('disables the native input and the toggle', () => {
      cy.mount(html`<gui-password label="Password" disabled></gui-password>`);

      input().should('be.disabled');
      toggle().should('be.disabled');
    });
  });
});
