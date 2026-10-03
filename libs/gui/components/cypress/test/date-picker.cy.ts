import { html } from 'lit';
import type { GuiDatePicker } from '../../src/lib/components/date-picker';

const part = (type: 'month' | 'day' | 'year') => cy.get(`gui-date-picker [data-type="${type}"]`);
const toggle = () => cy.get('gui-date-picker button[aria-haspopup]');
const calendar = () => cy.get('gui-date-picker gui-calendar');
const day = (date: string) => cy.get(`gui-date-picker [data-date="${date}"]`);
const element = () => cy.get<GuiDatePicker>('gui-date-picker');
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-date-picker', () => {
  describe('rendering', () => {
    it('renders its value in the field with the calendar closed', () => {
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
          toggle-aria-label="Pick a date"
        ></gui-date-picker>`,
      );

      part('month').should('have.value', '03');
      part('day').should('have.value', '15');
      part('year').should('have.value', '2026');
      toggle()
        .should('have.attr', 'aria-label', 'Pick a date')
        .and('have.attr', 'aria-haspopup', 'dialog')
        .and('have.attr', 'aria-expanded', 'false');
      calendar().should('not.exist');
    });

    it('opens a calendar dialog on the value with its bounds, and focuses the selected day', () => {
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
          min-date="2026-03-05"
          disabled-ranges='[{"start":"2026-03-20","end":"2026-03-22"}]'
          month-format="short"
        ></gui-date-picker>`,
      );

      toggle().click();

      toggle().should('have.attr', 'aria-expanded', 'true');
      calendar().should('have.attr', 'role', 'dialog');
      toggle()
        .invoke('attr', 'aria-controls')
        .then((id) => calendar().should('have.attr', 'id', id));
      cy.focused().should('have.attr', 'data-date', '2026-03-15');
      cy.get('gui-date-picker .gui-calendar__month-name').should('have.text', 'Mar');
      day('2026-03-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-21').should('have.attr', 'aria-disabled', 'true');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when a day is picked, and closes the calendar', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date-picker>`,
      );

      toggle().click();
      day('2026-03-18').click();

      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: '2026-03-18' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18' });
      calendar().should('not.exist');
      part('day').should('have.value', '18');
      element().should('have.prop', 'value', '2026-03-18');
    });

    it('returns focus to the field when a pick closes the calendar', () => {
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
        ></gui-date-picker>`,
      );

      toggle().click();
      day('2026-03-18').click();

      calendar().should('not.exist');
      cy.focused().should('have.attr', 'data-type', 'month');
    });

    it('fires gui-input and gui-change with a typed date', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date-picker>`,
      );

      part('month').type('03');
      cy.focused().type('15');
      cy.focused().type('2026');

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: '2026-03-15' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-15' });
      day('2026-03-15').should('have.attr', 'aria-selected', 'true');
    });

    it('fires gui-input-error for a typed date outside its bounds or inside disabled-ranges', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          max-date="2026-03-31"
          max-date-message="Too late"
          disabled-ranges='[{"start":"2026-03-10","end":"2026-03-12"}]'
          disabled-date-range-message="Closed that day"
          @gui-input-error=${onInputError}
        ></gui-date-picker>`,
      );

      part('month').type('03');
      cy.focused().type('11');
      cy.focused().type('2026');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed that day' });

      part('month').type('{upArrow}');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
      element().should('have.prop', 'value', '2026-04-11');
    });

    it('fires gui-blur when focus leaves the picker, not when it moves into the calendar', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-date-picker
            label="Start"
            locale-id="en-US"
            value="2026-03-15"
            @gui-blur=${onBlur}
          ></gui-date-picker>
          <button id="outside">Outside</button>`,
      );

      part('day').focus();
      day('2026-03-15').focus();
      cy.get('@blur').should('not.have.been.called');

      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
      calendar().should('not.exist');
    });

    it('reports a partly typed date as incomplete when focus leaves', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-picker
            label="Start"
            locale-id="en-US"
            incomplete-message="Finish the date"
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-date-picker>
          <button id="outside">Outside</button>`,
      );

      part('month').type('03');
      cy.focused().should('have.attr', 'data-type', 'day');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the date' });
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
            <gui-date-picker
              label="Start"
              locale-id="en-US"
              invalid-date-message="No such day"
            ></gui-date-picker>
          </div>
          <button id="outside">Outside</button>`,
      );

      part('month').type('02');
      cy.focused().type('31');
      cy.focused().type('2026');
      cy.get('#outside').focus();

      cy.get('@focus').should('not.have.been.called');
      cy.get('@partsChange').should('not.have.been.called');
      cy.get('@listToggle').should('not.have.been.called');
      element().then(([el]) => {
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'No such day' });
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
        ></gui-date-picker>`,
      );

      element().invoke('prop', 'value', '2026-07-04');

      part('month').should('have.value', '07');
      part('day').should('have.value', '04');
      toggle().click();
      day('2026-07-04').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('keyboard', () => {
    it('picks a day with the arrow keys and Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
          @gui-change=${onChange}
        ></gui-date-picker>`,
      );

      toggle().click();
      cy.focused().type('{downArrow}{rightArrow}{enter}');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-23' });
      calendar().should('not.exist');
      cy.focused().should('have.attr', 'data-type', 'month');
    });

    it('closes the calendar with Escape and returns focus to the field', () => {
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
        ></gui-date-picker>`,
      );

      toggle().click();
      cy.focused().should('have.attr', 'data-date', '2026-03-15').type('{esc}');

      calendar().should('not.exist');
      toggle().should('have.attr', 'aria-expanded', 'false');
      cy.focused().should('have.attr', 'data-type', 'month');
    });
  });

  describe('states', () => {
    it('keeps its value when read-only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
          readonly
          @gui-change=${onChange}
        ></gui-date-picker>`,
      );

      part('day').should('have.attr', 'readonly');
      toggle().click();
      day('2026-03-18').click();

      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value', '2026-03-15');
    });

    it('disables the field and the calendar button', () => {
      cy.mount(html`<gui-date-picker label="Start" locale-id="en-US" disabled></gui-date-picker>`);

      part('month').should('be.disabled');
      part('day').should('be.disabled');
      part('year').should('be.disabled');
      toggle().should('be.disabled');
    });
  });
});
