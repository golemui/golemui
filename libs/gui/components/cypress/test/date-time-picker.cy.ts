import { html } from 'lit';
import type { GuiDateTimePicker } from '../../src/lib/components/date-time-picker';

type PartType = 'month' | 'day' | 'year' | 'hour' | 'minute' | 'dayPeriod';

const part = (type: PartType) => cy.get(`gui-date-time-picker gui-date-time [data-type="${type}"]`);
const toggle = () => cy.get('gui-date-time-picker > .gui-widget > button[aria-haspopup]');
const calendar = () => cy.get('gui-date-time-picker gui-date-time-calendar');
const day = (date: string) => cy.get(`gui-date-time-picker [data-date="${date}"]`);
const calendarHour = () => cy.get('gui-date-time-calendar gui-time [data-type="hour"]');
const option = (value: string) => cy.get(`gui-date-time-picker [data-value="${value}"]`);
const element = () => cy.get<GuiDateTimePicker>('gui-date-time-picker');
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-date-time-picker', () => {
  describe('rendering', () => {
    it('renders its value in the field with the popup closed', () => {
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
          toggle-aria-label="Pick a date and time"
        ></gui-date-time-picker>`,
      );

      part('month').should('have.value', '03');
      part('day').should('have.value', '15');
      part('year').should('have.value', '2026');
      part('hour').should('have.value', '02');
      part('minute').should('have.value', '30');
      part('dayPeriod').should('contain.text', 'PM');
      toggle()
        .should('have.attr', 'aria-label', 'Pick a date and time')
        .and('have.attr', 'aria-expanded', 'false');
      calendar().should('not.exist');
    });

    it('opens a calendar dialog on the value, with its bounds, and focuses the selected day', () => {
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
          min-date="2026-03-05"
          disabled-ranges='[{"start":"2026-03-20","end":"2026-03-20"}]'
        ></gui-date-time-picker>`,
      );

      toggle().click();

      toggle().should('have.attr', 'aria-expanded', 'true');
      calendar().should('have.attr', 'role', 'dialog');
      cy.focused().should('have.attr', 'data-date', '2026-03-15');
      day('2026-03-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-20').should('have.attr', 'aria-disabled', 'true');
      calendarHour().should('have.value', '02');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when a time is picked for the typed day, and closes', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date-time-picker>`,
      );

      part('month').type('03');
      cy.focused().type('18');
      cy.focused().type('2026');
      cy.focused().should('have.attr', 'data-type', 'hour');
      day('2026-03-18').should('have.attr', 'aria-selected', 'true');
      cy.get('@input').should('not.have.been.called');

      calendarHour().click();
      option('10:30:00').click();

      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18T10:30:00' });
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18T10:30:00' });
      calendar().should('not.exist');
      part('hour').should('have.value', '10');
      part('minute').should('have.value', '30');
      element().should('have.prop', 'value', '2026-03-18T10:30:00');
      cy.focused().should('have.attr', 'data-type', 'month');
    });

    it('fires gui-input and gui-change with a typed date-time', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          hour-format="24"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date-time-picker>`,
      );

      part('month').type('03');
      cy.focused().type('18');
      cy.focused().type('2026');
      cy.focused().type('14');
      cy.focused().type('45');

      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18T14:45:00' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18T14:45:00' });
    });

    it('fires gui-input-error for a date-time outside its bounds or inside its disabled ranges', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          hour-format="24"
          value="2026-03-18T14:45:00"
          max-date="2026-03-31"
          max-date-message="Too late"
          disabled-time-ranges='[{"start":"15:00:00","end":"16:00:00"}]'
          disabled-time-range-message="Closed then"
          @gui-input-error=${onInputError}
        ></gui-date-time-picker>`,
      );

      part('hour').type('{upArrow}');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed then' });

      part('month').type('{upArrow}');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
      element().should('have.prop', 'value', '2026-04-18T15:45:00');
    });

    it('fires gui-blur when focus leaves the picker, not when it moves into the popup', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-date-time-picker
            label="Start"
            locale-id="en-US"
            value="2026-03-15T14:30:00"
            @gui-blur=${onBlur}
          ></gui-date-time-picker>
          <button id="outside">Outside</button>`,
      );

      part('day').focus();
      day('2026-03-15').focus();
      cy.get('@blur').should('not.have.been.called');

      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
      calendar().should('not.exist');
    });

    it('reports a partly typed date-time as incomplete when focus leaves', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-time-picker
            label="Start"
            locale-id="en-US"
            incomplete-message="Finish it"
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-date-time-picker>
          <button id="outside">Outside</button>`,
      );

      part('month').type('03');
      cy.focused().should('have.attr', 'data-type', 'day');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Finish it' });
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
            <gui-date-time-picker
              label="Start"
              locale-id="en-US"
              hour-format="24"
              allow-custom-time
              max-time="17:00:00"
              max-time-message="Too late"
            ></gui-date-time-picker>
          </div>
          <button id="outside">Outside</button>`,
      );

      part('month').type('03');
      cy.focused().type('18');
      cy.focused().type('2026');
      day('2026-03-18').should('have.attr', 'aria-selected', 'true');
      calendarHour().type('18');
      cy.focused().type('00');
      cy.get('#outside').focus();

      calendar().should('not.exist');
      cy.get('@focus').should('not.have.been.called');
      cy.get('@partsChange').should('not.have.been.called');
      cy.get('@listToggle').should('not.have.been.called');
      element().then(([el]) => {
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
        ></gui-date-time-picker>`,
      );

      element().invoke('prop', 'value', '2026-07-04T08:05:00');

      part('month').should('have.value', '07');
      part('day').should('have.value', '04');
      part('hour').should('have.value', '08');
      part('minute').should('have.value', '05');
      toggle().click();
      day('2026-07-04').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('keyboard', () => {
    it('picks another day with the arrow keys and Enter, keeping the popup open', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
          @gui-input=${onInput}
        ></gui-date-time-picker>`,
      );

      toggle().click();
      cy.focused().type('{downArrow}{enter}');

      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-22T14:30:00' });
      calendar().should('exist');
      part('day').should('have.value', '22');
    });

    it('closes the popup with Escape and returns focus to the field', () => {
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
        ></gui-date-time-picker>`,
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
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
          readonly
          @gui-input=${onInput}
        ></gui-date-time-picker>`,
      );

      part('day').should('have.attr', 'readonly');
      toggle().click();
      day('2026-03-18').click();

      cy.get('@input').should('not.have.been.called');
      element().should('have.prop', 'value', '2026-03-15T14:30:00');
    });

    it('disables the field and the popup button', () => {
      cy.mount(
        html`<gui-date-time-picker
          label="Start"
          locale-id="en-US"
          disabled
        ></gui-date-time-picker>`,
      );

      cy.get('gui-date-time-picker gui-date-time [data-type]').each(($part) => {
        cy.wrap($part).should('be.disabled');
      });
      toggle().should('be.disabled');
    });
  });
});
