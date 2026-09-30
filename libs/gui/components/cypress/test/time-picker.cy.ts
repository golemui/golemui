import { html } from 'lit';
import type { GuiTimePicker } from '../../src/lib/components/time-picker';

const part = (type: 'hour' | 'minute' | 'dayPeriod') =>
  cy.get(`gui-time-picker [data-type="${type}"]`);
const toggle = () => cy.get('gui-time-picker button[aria-haspopup]');
const list = () => cy.get('gui-time-picker gui-time-list');
const option = (value: string) => cy.get(`gui-time-picker [data-value="${value}"]`);
const element = () => cy.get<GuiTimePicker>('gui-time-picker');
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-time-picker', () => {
  describe('rendering', () => {
    it('renders its value in the field with the time list closed', () => {
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          value="14:30:00"
          toggle-aria-label="Pick a time"
        ></gui-time-picker>`,
      );

      part('hour').should('have.value', '02').and('have.attr', 'readonly');
      part('minute').should('have.value', '30');
      part('dayPeriod').should('contain.text', 'PM');
      toggle()
        .should('have.attr', 'aria-label', 'Pick a time')
        .and('have.attr', 'aria-expanded', 'false');
      list().should('have.attr', 'hidden');
    });

    it('lists the times between min-time and max-time every minute-step', () => {
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="10:00:00"
          minute-step="15"
          disabled-ranges='[{"start":"09:30:00","end":"09:30:00"}]'
        ></gui-time-picker>`,
      );

      toggle().click();

      cy.get('gui-time-picker .gui-time-list__option').should('have.length', 5);
      option('09:30:00').should('be.disabled');
      option('09:45:00').should('contain.text', '09:45 AM');
    });
  });

  describe('value', () => {
    it('fires gui-list-toggle as the list opens and closes', () => {
      const onListToggle = cy.spy().as('listToggle');
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="10:00:00"
          @gui-list-toggle=${onListToggle}
        ></gui-time-picker>`,
      );

      toggle().click();
      list().should('not.have.attr', 'hidden');
      toggle().should('have.attr', 'aria-expanded', 'true');
      cy.get('@listToggle').its('firstCall.args.0.detail').should('deep.equal', { open: true });

      toggle().click();

      list().should('have.attr', 'hidden');
      cy.get('@listToggle').its('secondCall.args.0.detail').should('deep.equal', { open: false });
    });

    it('fires gui-input and gui-change when a time is picked from the list, and closes it', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="10:00:00"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-time-picker>`,
      );

      toggle().click();
      option('09:30:00').click();

      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: '09:30:00' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: '09:30:00' });
      element().should('have.prop', 'value', '09:30:00');
      part('hour').should('have.value', '09');
      part('minute').should('have.value', '30');
      list().should('have.attr', 'hidden');
    });

    it('fires gui-input-error for a typed time outside min-time and max-time', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          hour-format="24"
          allow-custom-time
          min-time="09:00:00"
          max-time="17:00:00"
          max-time-message="Too late"
          @gui-input=${onInput}
          @gui-input-error=${onInputError}
        ></gui-time-picker>`,
      );

      part('hour').type('18');
      cy.focused().type('15');

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: '18:15:00' });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
    });

    it('fires gui-blur when focus leaves the picker', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-time-picker
            label="At"
            locale-id="en-US"
            min-time="09:00:00"
            max-time="10:00:00"
            @gui-blur=${onBlur}
          ></gui-time-picker>
          <button id="outside">Outside</button>`,
      );

      toggle().click();
      cy.focused().should('have.class', 'gui-time-list__option');
      cy.get('@blur').should('not.have.been.called');

      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
      list().should('have.attr', 'hidden');
    });

    it('fires only its own events, which reach an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      const onFocus = cy.spy().as('focus');
      const onPartsChange = cy.spy().as('partsChange');
      const onInputError = cy.spy().as('inputError');
      const onListToggle = cy.spy().as('listToggle');
      cy.mount(
        html`<div
            @gui-blur=${onBlur}
            @gui-focus=${onFocus}
            @gui-parts-change=${onPartsChange}
            @gui-input-error=${onInputError}
            @gui-list-toggle=${onListToggle}
          >
            <gui-time-picker
              label="At"
              locale-id="en-US"
              hour-format="24"
              allow-custom-time
              value="10:00:00"
              max-time="17:00:00"
              max-time-message="Too late"
            ></gui-time-picker>
          </div>
          <button id="outside">Outside</button>`,
      );

      part('hour').type('{selectAll}18');
      cy.get('#outside').focus();

      cy.get('@focus').should('not.have.been.called');
      cy.get('@partsChange').should('not.have.been.called');
      element().then(([el]) => {
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@listToggle').should('have.been.calledTwice');
        cy.get('@listToggle').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
    });

    it('shows a value set from outside in the field and the list', () => {
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="10:00:00"
          value="09:00:00"
        ></gui-time-picker>`,
      );

      element().invoke('prop', 'value', '09:30:00');

      part('minute').should('have.value', '30');
      option('09:30:00').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('keyboard', () => {
    it('steps through the listed times with the arrows, skipping disabled ones', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="10:00:00"
          .disabledRanges=${[{ start: '09:30:00', end: '09:30:00' }]}
          @gui-input=${onInput}
        ></gui-time-picker>`,
      );

      part('hour').focus().trigger('keydown', { key: 'ArrowDown' });
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: '09:00:00' });

      part('hour').trigger('keydown', { key: 'ArrowDown' });

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: '10:00:00' });
      part('hour').should('have.value', '10');
      part('minute').should('have.value', '00');
    });

    it('commits a typed time with Enter and closes the list', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          hour-format="24"
          allow-custom-time
          @gui-change=${onChange}
        ></gui-time-picker>`,
      );

      part('hour').type('09');
      cy.focused().type('45');
      list().should('not.have.attr', 'hidden');
      cy.get('@change').should('not.have.been.called');

      cy.focused().type('{enter}');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: '09:45:00' });
      list().should('have.attr', 'hidden');
    });

    it('closes the list with Escape and returns focus to the field', () => {
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="10:00:00"
        ></gui-time-picker>`,
      );

      toggle().click();
      cy.focused().should('have.class', 'gui-time-list__option').type('{esc}');

      list().should('have.attr', 'hidden');
      cy.focused().should('have.attr', 'data-type', 'hour');
    });
  });

  describe('states', () => {
    it('keeps its value when read-only', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-time-picker
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="10:00:00"
          value="09:00:00"
          readonly
          @gui-input=${onInput}
        ></gui-time-picker>`,
      );

      part('hour').focus().trigger('keydown', { key: 'ArrowDown' });
      list().should('not.have.attr', 'hidden');
      option('09:30:00').click();

      cy.get('@input').should('not.have.been.called');
      element().should('have.prop', 'value', '09:00:00');
    });

    it('disables the field and the list button', () => {
      cy.mount(html`<gui-time-picker label="At" locale-id="en-US" disabled></gui-time-picker>`);

      part('hour').should('be.disabled');
      part('dayPeriod').should('be.disabled');
      toggle().should('be.disabled');
    });
  });
});
