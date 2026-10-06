import { html } from 'lit';
import type { GuiTextarea } from '../../src/lib/components/textarea';

const textarea = () => cy.get('gui-textarea textarea');
const element = () => cy.get<GuiTextarea>('gui-textarea');
const counter = () => cy.get('gui-textarea .gui-textarea--counter');

describe('gui-textarea', () => {
  describe('rendering', () => {
    it('renders its attributes on the native textarea', () => {
      cy.mount(
        html`<gui-textarea
          label="Bio"
          value="Hello"
          placeholder="About you"
          autocomplete="off"
          required
        ></gui-textarea>`,
      );

      textarea()
        .should('have.value', 'Hello')
        .and('have.attr', 'placeholder', 'About you')
        .and('have.attr', 'autocomplete', 'off');
      // The element validates itself: only the ARIA state is on the native control.
      textarea().should('have.attr', 'aria-required', 'true').and('not.have.attr', 'required');
      cy.get('gui-textarea label').should('contain.text', 'Bio');
    });

    it('describes the textarea with its hint', () => {
      cy.mount(html`<gui-textarea label="Bio" hint="A few lines"></gui-textarea>`);

      textarea()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'A few lines'));
    });

    it('shows its errors and points the textarea at them', () => {
      cy.mount(html`<gui-textarea label="Bio" .errors=${['Too short']}></gui-textarea>`);

      textarea().should('have.attr', 'aria-invalid', 'true');
      textarea()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Too short'));
    });

    it('sets its height from minimum-height', () => {
      cy.mount(html`<gui-textarea label="Bio" minimum-height="200"></gui-textarea>`);

      textarea().should('have.css', 'min-height', '200px');
    });
  });

  describe('counter', () => {
    it('counts the characters left by default', () => {
      cy.mount(html`<gui-textarea label="Bio" maxlength="10"></gui-textarea>`);

      counter().should('contain.text', '10').and('contain.text', '/ 10');
      textarea().type('Hey');
      counter().children().first().should('have.text', '7');
    });

    it('counts the characters used with counter-mode="current"', () => {
      cy.mount(
        html`<gui-textarea label="Bio" maxlength="10" counter-mode="current"></gui-textarea>`,
      );

      textarea().type('Hey');
      counter().children().first().should('have.text', '3');
    });

    it('flags the counter once the text is over the limit', () => {
      cy.mount(html`<gui-textarea label="Bio" maxlength="3" value="Hey"></gui-textarea>`);

      counter().should('not.have.class', 'gui-textarea--counter__error');
      textarea().type('!');
      counter().should('have.class', 'gui-textarea--counter__error');
    });

    it('lets the text go over maxlength, which only drives the counter', () => {
      cy.mount(html`<gui-textarea label="Bio" maxlength="3"></gui-textarea>`);

      textarea().type('Hello').should('have.value', 'Hello');
      textarea().should('not.have.attr', 'maxlength');
      counter().children().first().should('have.text', '-2');
    });

    it('renders no counter without maxlength', () => {
      cy.mount(html`<gui-textarea label="Bio" counter-mode="current"></gui-textarea>`);

      counter().should('not.exist');
    });
  });

  describe('value', () => {
    it('fires gui-input on every keystroke', () => {
      const onInput = cy.spy().as('input');
      cy.mount(html`<gui-textarea label="Bio" @gui-input=${onInput}></gui-textarea>`);

      textarea().type('Hi');

      cy.get('@input').should('have.callCount', 2);
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 'Hi' });
      element().should('have.prop', 'value', 'Hi');
    });

    it('adds a line on Enter without firing gui-change', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<gui-textarea label="Bio" @gui-change=${onChange}></gui-textarea>`);

      textarea().type('Hi{enter}');

      textarea().should('have.value', 'Hi\n');
      cy.get('@change').should('not.have.been.called');
    });

    it('fires gui-change and gui-blur when focus leaves', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-textarea label="Bio" @gui-change=${onChange} @gui-blur=${onBlur}></gui-textarea>`,
      );

      textarea().type('Hi{enter}there').blur();

      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'Hi\nthere' });
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-textarea label="Bio" value="Hello"></gui-textarea>`);

      element().invoke('prop', 'value', 'Bye');

      textarea().should('have.value', 'Bye');
    });
  });

  describe('states', () => {
    it('makes the native textarea read-only', () => {
      cy.mount(html`<gui-textarea label="Bio" value="Hello" readonly></gui-textarea>`);

      textarea().should('have.attr', 'readonly');
      textarea().should('have.attr', 'aria-readonly', 'true');
      textarea().focus().should('be.focused').and('have.value', 'Hello');
    });

    it('disables the native textarea', () => {
      cy.mount(html`<gui-textarea label="Bio" disabled></gui-textarea>`);

      textarea().should('be.disabled');
    });
  });
});
