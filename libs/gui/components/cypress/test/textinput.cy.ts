import { html } from 'lit';
import type { GuiTextinput } from '../../src/lib/components/textinput';

const input = () => cy.get('gui-textinput input');
const element = () => cy.get<GuiTextinput>('gui-textinput');

describe('gui-textinput', () => {
  describe('rendering', () => {
    it('renders its attributes on the native input', () => {
      cy.mount(
        html`<gui-textinput
          label="Name"
          value="Ada"
          placeholder="Your name"
          autocomplete="name"
          required
        ></gui-textinput>`,
      );

      input()
        .should('have.value', 'Ada')
        .and('have.attr', 'placeholder', 'Your name')
        .and('have.attr', 'autocomplete', 'name')
        .and('have.attr', 'required');
      cy.get('gui-textinput label').should('contain.text', 'Name');
    });

    it('describes the input with its hint', () => {
      cy.mount(html`<gui-textinput label="Name" hint="As on your passport"></gui-textinput>`);

      input()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'As on your passport'));
    });

    it('shows its errors and points the input at them', () => {
      cy.mount(html`<gui-textinput label="Name" .errors=${['Too short']}></gui-textinput>`);

      input().should('have.attr', 'aria-invalid', 'true');
      input()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Too short'));
    });

    it('holds its errors back while touched is false', () => {
      cy.mount(
        html`<gui-textinput
          label="Name"
          .errors=${['Too short']}
          .touched=${false}
        ></gui-textinput>`,
      );

      input().should('not.have.attr', 'aria-invalid');
      cy.get('gui-textinput .gui-validator__error').should('not.exist');
    });

    it('renders its icon hidden from assistive technology', () => {
      cy.mount(html`<gui-textinput label="Search" icon="icon-search"></gui-textinput>`);

      cy.get('gui-textinput .icon-search').should('have.attr', 'aria-hidden', 'true');
    });
  });

  describe('value', () => {
    it('fires gui-input on every keystroke and gui-change on Enter', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-textinput
          label="Name"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-textinput>`,
      );

      input().type('Ada{enter}');

      cy.get('@input').should('have.callCount', 3);
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 'Ada' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'Ada' });
      element().should('have.prop', 'value', 'Ada');
    });

    it('fires gui-change and gui-blur when focus leaves', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-textinput
          label="Name"
          @gui-change=${onChange}
          @gui-blur=${onBlur}
        ></gui-textinput>`,
      );

      input().type('Ada').blur();

      cy.get('@change').should('have.been.calledOnce');
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-textinput label="Name" value="Ada"></gui-textinput>`);

      element().invoke('prop', 'value', 'Grace');

      input().should('have.value', 'Grace');
    });
  });

  describe('states', () => {
    it('makes the native input read-only', () => {
      cy.mount(html`<gui-textinput label="Name" value="Ada" readonly></gui-textinput>`);

      input().should('have.attr', 'readonly');
      input().should('have.attr', 'aria-readonly', 'true');
      input().focus().should('be.focused').and('have.value', 'Ada');
    });

    it('disables the native input', () => {
      cy.mount(html`<gui-textinput label="Name" disabled></gui-textinput>`);

      input().should('be.disabled');
    });
  });
});
