import { html } from 'lit';
import type { GuiDateTimeCalendar } from '../../src/lib/components/date-time-calendar';

const day = (date: string) => cy.get(`gui-date-time-calendar [data-date="${date}"]`);
const timePart = (type: 'hour' | 'minute' | 'dayPeriod') =>
  cy.get(`gui-date-time-calendar gui-time [data-type="${type}"]`);
const timeList = () => cy.get('gui-date-time-calendar gui-time-list');
const option = (value: string) => cy.get(`gui-date-time-calendar [data-value="${value}"]`);
const element = () => cy.get<GuiDateTimeCalendar>('gui-date-time-calendar');
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

/** Mounted on a March 2026 value, then emptied: the calendar stays on March with nothing picked. */
const mountEmpty = (template: unknown) => {
  cy.mount(template);
  element().then(([el]) => {
    el.value = undefined;
  });
  day('2026-03-15').should('have.attr', 'aria-selected', 'false');
};

describe('gui-date-time-calendar', () => {
  describe('rendering', () => {
    it('renders the month of its value with the selected day and time', () => {
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
        ></gui-date-time-calendar>`,
      );

      cy.get('gui-date-time-calendar .gui-calendar__month-name').should('have.text', 'March');
      day('2026-03-15').should('have.attr', 'aria-selected', 'true');
      timePart('hour').should('have.value', '02').and('have.attr', 'readonly');
      timePart('minute').should('have.value', '30');
      timePart('dayPeriod').should('contain.text', 'PM');
    });

    it('disables days outside its bounds and the times in disabled-time-ranges for the day', () => {
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-13T09:00:00"
          min-date="2026-03-05"
          disabled-ranges='[{"start":"2026-03-20","end":"2026-03-20"}]'
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          disabled-time-ranges='[{"start":"10:00:00","end":"10:00:00","weekdays":[5]}]'
        ></gui-date-time-calendar>`,
      );

      day('2026-03-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-20').should('have.attr', 'aria-disabled', 'true');

      timePart('hour').click();

      cy.get('gui-date-time-calendar .gui-time-list__option').should('have.length', 5);
      option('10:00:00').should('be.disabled');
      option('10:30:00').should('not.be.disabled');
    });

    it('writes the days in day-format and the weekday names in weekday-format', () => {
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
          day-format="2-digit"
          weekday-format="long"
        ></gui-date-time-calendar>`,
      );

      day('2026-03-05').invoke('text').invoke('trim').should('equal', '05');
      cy.get('gui-date-time-calendar .gui-calendar__weekday').first().should('have.text', 'Sunday');
    });
  });

  describe('value', () => {
    it('fires gui-parts-change when a day is picked with no time, keeping the value empty', () => {
      const onInput = cy.spy().as('input');
      const onPartsChange = cy.spy().as('partsChange');
      mountEmpty(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
          @gui-input=${onInput}
          @gui-parts-change=${onPartsChange}
        ></gui-date-time-calendar>`,
      );

      day('2026-03-18').click();

      cy.get('@partsChange')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { date: '2026-03-18', time: null });
      cy.get('@input').should('not.have.been.called');
      element().should(([el]) => expect(el.value).to.equal(undefined));
      day('2026-03-18').should('have.attr', 'aria-selected', 'true');
    });

    it('fires gui-input and gui-change when a time is picked for the chosen day', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      mountEmpty(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
          min-time="09:00:00"
          max-time="11:00:00"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date-time-calendar>`,
      );

      day('2026-03-18').click();
      timePart('hour').click();
      cy.get('gui-date-time-calendar .gui-calendar__days-grid').should('not.exist');
      option('10:30:00').click();

      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18T10:30:00' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18T10:30:00' });
      timeList().should('have.attr', 'hidden');
      cy.get('gui-date-time-calendar .gui-calendar__days-grid').should('exist');
      element().should('have.prop', 'value', '2026-03-18T10:30:00');
    });

    it('fires gui-input with the new day, keeping the time, when another day is picked', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:30:00"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date-time-calendar>`,
      );

      day('2026-03-18').click();

      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-18T10:30:00' });
      cy.get('@change').should('not.have.been.called');
      timePart('hour').should('have.value', '10');
    });

    it('fires gui-input-error when the kept time is not allowed on the picked day', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-16T10:00:00"
          disabled-time-ranges='[{"start":"09:00:00","end":"11:00:00","date":"2026-03-18"}]'
          disabled-time-range-message="Closed then"
          @gui-input-error=${onInputError}
        ></gui-date-time-calendar>`,
      );

      day('2026-03-18').click();

      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Closed then' });
      element().should('have.prop', 'value', '2026-03-18T10:00:00');
    });

    it('fires gui-input-error for a typed time outside min-time and max-time', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          hour-format="24"
          allow-custom-time
          value="2026-03-15T10:00:00"
          min-time="09:00:00"
          max-time="17:00:00"
          max-time-message="Too late"
          @gui-input=${onInput}
          @gui-input-error=${onInputError}
        ></gui-date-time-calendar>`,
      );

      timePart('hour').type('{selectAll}18');

      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-15T18:00:00' });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
    });

    it('fires gui-blur and reports a day without a time as incomplete when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      mountEmpty(
        html`<gui-date-time-calendar
            label="Start"
            locale-id="en-US"
            value="2026-03-15T10:00:00"
            incomplete-message="Pick a time too"
            @gui-blur=${onBlur}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-date-time-calendar>
          <button id="outside">Outside</button>`,
      );

      day('2026-03-18').click();
      cy.get('@blur').should('not.have.been.called');
      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Pick a time too' });
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
        ></gui-date-time-calendar>`,
      );

      element().invoke('prop', 'value', '2026-07-04T08:30:00');

      cy.get('gui-date-time-calendar .gui-calendar__month-name').should('have.text', 'July');
      day('2026-07-04').should('have.attr', 'aria-selected', 'true');
      timePart('hour').should('have.value', '08');
      timePart('minute').should('have.value', '30');
    });

    it('fires only its own events, which reach an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      const onFocus = cy.spy().as('focus');
      const onPartsChange = cy.spy().as('partsChange');
      const onInputError = cy.spy().as('inputError');
      const onListToggle = cy.spy().as('listToggle');
      mountEmpty(
        html`<div
            @gui-blur=${onBlur}
            @gui-focus=${onFocus}
            @gui-parts-change=${onPartsChange}
            @gui-input-error=${onInputError}
            @gui-list-toggle=${onListToggle}
          >
            <gui-date-time-calendar
              label="Start"
              locale-id="en-US"
              hour-format="24"
              allow-custom-time
              value="2026-03-15T10:00:00"
              max-time="17:00:00"
              max-time-message="Too late"
            ></gui-date-time-calendar>
          </div>
          <button id="outside">Outside</button>`,
      );

      day('2026-03-18').click();
      timePart('hour').type('18');
      cy.focused().type('00');
      cy.get('#outside').focus();

      cy.get('@focus').should('not.have.been.called');
      cy.get('@listToggle').should('not.have.been.called');
      element().then(([el]) => {
        cy.get('@partsChange').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
    });
  });

  describe('keyboard', () => {
    it('picks a day with the arrow keys and Enter, and a time from the list with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
          min-time="09:00:00"
          max-time="11:00:00"
          @gui-change=${onChange}
        ></gui-date-time-calendar>`,
      );

      day('2026-03-15').focus().type('{rightArrow}{enter}');
      day('2026-03-16').should('have.attr', 'aria-selected', 'true');

      timePart('hour').focus();
      timeList().should('not.have.attr', 'hidden');
      option('10:00:00').should('have.attr', 'tabindex', '0').focus().type('{rightArrow}{enter}');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-16T10:30:00' });
    });
  });

  describe('states', () => {
    it('keeps its value when read-only', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
          readonly
          @gui-input=${onInput}
        ></gui-date-time-calendar>`,
      );

      day('2026-03-18').click();
      timePart('hour').click();

      timeList().should('have.attr', 'hidden');
      cy.get('@input').should('not.have.been.called');
      element().should('have.prop', 'value', '2026-03-15T10:00:00');
    });

    it('marks itself disabled and disables the time field', () => {
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
          disabled
        ></gui-date-time-calendar>`,
      );

      cy.get('gui-date-time-calendar .gui-calendar-input').should(
        'have.attr',
        'aria-disabled',
        'true',
      );
      timePart('hour').should('be.disabled');
      cy.get('gui-date-time-calendar gui-time-picker button[aria-haspopup]').should('be.disabled');
    });

    it('takes every day, the month buttons and the year selector out of reach when disabled', () => {
      cy.mount(
        html`<gui-date-time-calendar
          label="Start"
          locale-id="en-US"
          value="2026-03-15T10:00:00"
          disabled
        ></gui-date-time-calendar>`,
      );

      day('2026-03-15').should('be.disabled').and('have.attr', 'tabindex', '-1');
      cy.get('gui-date-time-calendar .gui-calendar__month-button--prev').should('be.disabled');
      cy.get('gui-date-time-calendar .gui-calendar__month-button--next').should('be.disabled');
      cy.get('gui-date-time-calendar .gui-calendar__year-selector').should('be.disabled');
      cy.get('gui-date-time-calendar .gui-calendar__day-button')
        .filter(':enabled, [tabindex="0"]')
        .should('not.exist');
    });
  });
});
