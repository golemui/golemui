import { html } from 'lit';
import type { GuiNumber } from '../../src/lib/components/number';

const input = () => cy.get('gui-number input');
const element = () => cy.get<GuiNumber>('gui-number');

describe('gui-number', () => {
  describe('rendering', () => {
    it('renders its attributes on the native input', () => {
      cy.mount(
        html`<gui-number
          label="Age"
          value="42"
          step="5"
          minimum="18"
          maximum="99"
          placeholder="Your age"
          required
        ></gui-number>`,
      );

      input()
        .should('have.value', '42')
        .and('have.attr', 'type', 'number')
        .and('have.attr', 'step', '5')
        .and('have.attr', 'min', '18')
        .and('have.attr', 'max', '99')
        .and('have.attr', 'placeholder', 'Your age')
        .and('have.attr', 'required');
      element().should('have.prop', 'value', 42);
      cy.get('gui-number label').should('contain.text', 'Age');
    });

    it('describes the input with its hint and points it at its errors', () => {
      cy.mount(
        html`<gui-number label="Age" hint="In years" .errors=${['Too young']}></gui-number>`,
      );

      input()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'In years'));
      input().should('have.attr', 'aria-invalid', 'true');
      input()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Too young'));
    });
  });

  describe('value', () => {
    it('fires gui-input with the number on every keystroke and gui-change on Enter', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-number label="Age" @gui-input=${onInput} @gui-change=${onChange}></gui-number>`,
      );

      input().type('12.5{enter}');

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 12.5 });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 12.5 });
      element().should('have.prop', 'value', 12.5);
    });

    it('fires gui-change and gui-blur when focus leaves', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-number label="Age" @gui-change=${onChange} @gui-blur=${onBlur}></gui-number>`,
      );

      input().type('7').blur();

      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 7 });
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('reports an emptied field as undefined', () => {
      const onInput = cy.spy().as('input');
      cy.mount(html`<gui-number label="Age" value="7" @gui-input=${onInput}></gui-number>`);

      input().clear();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: undefined });
      element().should(([el]) => expect(el.value).to.equal(undefined));
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-number label="Age" value="7"></gui-number>`);

      element().invoke('prop', 'value', 0);
      input().should('have.value', '0');

      element().then(([el]) => {
        el.value = undefined;
      });
      input().should('have.value', '');
    });
  });

  describe('keyboard', () => {
    it('steps the value with ArrowUp and ArrowDown and commits each step', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-number
          label="Age"
          value="10"
          step="5"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-number>`,
      );

      input().type('{upArrow}');
      input().should('have.value', '15');
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: 15 });

      input().type('{downArrow}{downArrow}');
      input().should('have.value', '5');
      cy.get('@input').should('have.callCount', 3);
      cy.get('@change').should('have.callCount', 3);
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: 5 });
    });

    it('steps down from an empty field to -step, and up to step', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<gui-number label="Age" step="5" @gui-change=${onChange}></gui-number>`);

      input().type('{downArrow}');
      input().should('have.value', '-5');
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: -5 });

      input().clear().type('{upArrow}');
      input().should('have.value', '5');
    });

    it('steps down from an empty field to its minimum', () => {
      cy.mount(html`<gui-number label="Age" minimum="18"></gui-number>`);

      input().type('{downArrow}');

      input().should('have.value', '18');
      element().should('have.prop', 'value', 18);
    });

    it('clamps a step to minimum and maximum', () => {
      cy.mount(html`<gui-number label="Age" value="2" minimum="1" maximum="3"></gui-number>`);

      input().type('{upArrow}{upArrow}');
      input().should('have.value', '3');
      input().type('{downArrow}{downArrow}{downArrow}');
      input().should('have.value', '1');
    });

    it('blocks letters', () => {
      cy.mount(html`<gui-number label="Age"></gui-number>`);

      input().type('a1b2');

      input().should('have.value', '12');
    });
  });

  describe('states', () => {
    it('makes the native input read-only and does not step', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-number label="Age" value="5" readonly @gui-change=${onChange}></gui-number>`,
      );

      input().should('have.attr', 'readonly');
      input().should('have.attr', 'aria-readonly', 'true');
      input().focus().should('be.focused');
      input().trigger('keydown', { key: 'ArrowUp' });
      input().trigger('keydown', { key: 'ArrowDown' });
      input().should('have.value', '5');
      cy.get('@change').should('not.have.been.called');
    });

    it('disables the native input', () => {
      cy.mount(html`<gui-number label="Age" disabled></gui-number>`);

      input().should('be.disabled');
    });
  });
});
