import { html } from 'lit';
import type { GuiRangeDateTimeCalendar } from '../../src/lib/components/range-date-time-calendar';

type Endpoint = 'start' | 'end';

const tag = 'gui-range-date-time-calendar';
const element = () => cy.get<GuiRangeDateTimeCalendar>(tag);
const day = (date: string) => cy.get(`${tag} .gui-calendar__day-button[data-date="${date}"]`);
const pills = () => cy.get(`${tag} .gui-pills__pill`);
const weekdays = () =>
  cy
    .get(`${tag} .gui-calendar__weekday`)
    .then(($weekdays) => $weekdays.toArray().map((weekday) => weekday.textContent));
const picker = (endpoint: Endpoint) =>
  cy.get(`${tag} gui-time-picker.gui-range-date-time-calendar__${endpoint}`);
const pickTime = (endpoint: Endpoint, time: string) => {
  picker(endpoint).find('gui-time input[data-type="hour"]').click();
  picker(endpoint).find(`.gui-time-list__option[data-value="${time}"]`).click();
};

const june = [{ start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-date-time-calendar', () => {
  describe('rendering', () => {
    it('renders its attributes, its time pickers and the month of its first range', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          number-of-months="2"
          start-time-label="Clock in"
          end-time-label="Clock out"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      cy.get(`${tag} .gui-calendar__panel`).should('have.length', 2);
      picker('start').should('contain.text', 'Clock in');
      picker('end').should('contain.text', 'Clock out');
      day('2026-06-10').should('have.class', 'range-start');
      day('2026-06-11').should('have.class', 'in-range');
      day('2026-06-12').should('have.class', 'range-end');
      pills()
        .should('have.length', 1)
        .and('contain.text', '06/10/2026')
        .and('contain.text', '09:00 AM')
        .and('contain.text', '05:00 PM');
    });

    it('badges a day with several ranges', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          day-count-aria-label="{count} shifts"
          .value=${[
            { start: '2026-06-13T09:00:00', end: '2026-06-13T11:00:00' },
            { start: '2026-06-13T14:00:00', end: '2026-06-13T15:00:00' },
          ]}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-13')
        .find('.gui-range-date-time-calendar__day-count')
        .should('have.text', '2')
        .and('have.attr', 'aria-label')
        .and('match', /^2 shifts: /);
    });

    it('disables the days outside min-date-time and max-date-time', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          min-date-time="2026-06-05T10:00:00"
          max-date-time="2026-06-25T18:00:00"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-06-05').should('not.have.attr', 'aria-disabled');
      day('2026-06-25').should('not.have.attr', 'aria-disabled');
      day('2026-06-26').should('have.attr', 'aria-disabled', 'true');
    });

    it('writes the days in day-format and the weekday names in weekday-format', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          day-format="2-digit"
          weekday-format="short"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-05').invoke('text').invoke('trim').should('equal', '05');
      weekdays().should('deep.equal', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('disables the days outside min-date and max-date', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          min-date="2026-06-05"
          max-date="2026-06-25"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-06-05').should('not.have.attr', 'aria-disabled');
      day('2026-06-25').should('not.have.attr', 'aria-disabled');
      day('2026-06-26').should('have.attr', 'aria-disabled', 'true');
    });

    it('keeps the stricter of min-date and min-date-time, and of max-date and max-date-time', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          min-date="2026-06-08"
          min-date-time="2026-06-05T10:00:00"
          max-date="2026-06-25"
          max-date-time="2026-06-22T18:00:00"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-07').should('have.attr', 'aria-disabled', 'true');
      day('2026-06-08').should('not.have.attr', 'aria-disabled');
      day('2026-06-22').should('not.have.attr', 'aria-disabled');
      day('2026-06-23').should('have.attr', 'aria-disabled', 'true');
    });

    it('names the remove button of each pill after a date-time', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      pills().first().should('have.attr', 'aria-description', 'Remove date-time');
    });
  });

  describe('value', () => {
    it('fires gui-parts-change while picking and gui-input and gui-change once days and times are set', () => {
      const onParts = cy.spy().as('parts');
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          .value=${june}
          @gui-parts-change=${onParts}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-20').click();
      cy.get('@parts').its('lastCall.args.0.detail').should('deep.equal', {
        anchor: '2026-06-20',
        start: null,
        end: null,
        startTime: null,
        endTime: null,
      });

      day('2026-06-21').click();
      pickTime('start', '09:00:00');
      cy.get('@parts').its('lastCall.args.0.detail').should('deep.equal', {
        anchor: null,
        start: '2026-06-20',
        end: '2026-06-21',
        startTime: '09:00:00',
        endTime: null,
      });
      cy.get('@change').should('not.have.been.called');

      pickTime('end', '11:00:00');

      const value = [...june, { start: '2026-06-20T09:00:00', end: '2026-06-21T11:00:00' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('have.length', 2);
      element().should(([el]) => expect(el.value).to.deep.equal(value));
    });

    it('fires gui-input-error for a range that steps over a disabled day', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          disabled-ranges='[{"start":"2026-06-17T00:00:00","end":"2026-06-17T23:59:59"}]'
          disabled-range-message="Closed that day"
          .value=${june}
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-17').should('have.attr', 'aria-disabled', 'true');
      day('2026-06-15').click();
      day('2026-06-20').click();

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed that day' });
      cy.get('@change').should('not.have.been.called');
      day('2026-06-15').should('have.class', 'invalid-range-start');
    });

    it('fires gui-input-error with disabled-date-range-message for a range over a disabled day', () => {
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          disabled-ranges='[{"start":"2026-06-17T00:00:00","end":"2026-06-17T23:59:59"}]'
          disabled-date-range-message="Closed that day"
          disabled-range-message="Slot taken"
          .value=${june}
          @gui-input-error=${onError}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-15').click();
      day('2026-06-20').click();

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed that day' });
    });

    it('fires gui-input-error for a time past max-date-time', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          allow-custom-time
          hour-format="24"
          max-date-time="2026-06-20T12:00:00"
          max-date-time-message="Too late"
          .value=${june}
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-19').click();
      day('2026-06-20').click();
      pickTime('start', '09:00:00');
      picker('end').find('gui-time input[data-type="hour"]').type('13');
      picker('end').find('gui-time input[data-type="minute"]').type('00{enter}');

      cy.get('@error').should('have.been.calledWithMatch', {
        target: Cypress.sinon.match.has('tagName', 'GUI-RANGE-DATE-TIME-CALENDAR'),
        detail: { message: 'Too late' },
      });
      cy.get('@change').should('not.have.been.called');
      pills().should('have.length', 1);
    });

    it('fires gui-input-error and gui-blur when focus leaves a half-picked range', () => {
      const onError = cy.spy().as('error');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-date-time-calendar
            label="Shift"
            locale-id="en-US"
            incomplete-message="Finish the range"
            .value=${june}
            @gui-input-error=${onError}
            @gui-blur=${onBlur}
          ></gui-range-date-time-calendar>
          <button>Next</button>`,
      );

      day('2026-06-20').click();
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
      cy.get('@blur').should('have.been.calledOnce');
      pills().should('have.length', 1);
    });

    it('fires gui-change without the range whose pill is removed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      cy.get(`${tag} .gui-pills__pill-remove`).click();

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });

    it('fires only its own events, which reach an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      const onFocus = cy.spy().as('focus');
      const onPartsChange = cy.spy().as('partsChange');
      const onInputError = cy.spy().as('inputError');
      const onRangeClick = cy.spy().as('rangeClick');
      const onEditStateChange = cy.spy().as('editStateChange');
      const onListToggle = cy.spy().as('listToggle');
      cy.mount(
        html`<div
            @gui-blur=${onBlur}
            @gui-focus=${onFocus}
            @gui-parts-change=${onPartsChange}
            @gui-input-error=${onInputError}
            @gui-range-click=${onRangeClick}
            @gui-edit-state-change=${onEditStateChange}
            @gui-list-toggle=${onListToggle}
          >
            <gui-range-date-time-calendar
              label="Shift"
              locale-id="en-US"
              hour-format="24"
              allow-custom-time
              disabled-ranges='[{"start":"2026-06-17T13:00:00","end":"2026-06-17T14:00:00"}]'
              disabled-range-message="Closed at lunch"
              .value=${june}
            ></gui-range-date-time-calendar>
          </div>
          <button id="outside">Outside</button>`,
      );

      day('2026-06-15').click();
      day('2026-06-17').click();
      pickTime('start', '09:00:00');
      picker('end').find('gui-time input[data-type="hour"]').click().type('13');
      cy.focused().type('00');
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
        cy.get('@partsChange').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
      });
      // The end time picker's rejection of the typed time, reported as the calendar's own.
      cy.get('@inputError').should('have.been.calledWithMatch', {
        detail: { message: 'Closed at lunch' },
      });
      cy.get('@focus').should('not.have.been.called');
      cy.get('@rangeClick').should('not.have.been.called');
      cy.get('@editStateChange').should('not.have.been.called');
      cy.get('@listToggle').should('not.have.been.called');
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      element().invoke('prop', 'value', [
        { start: '2026-09-01T08:00:00', end: '2026-09-03T10:00:00' },
      ]);

      pills().should('have.length', 1).and('contain.text', '09/01/2026');
      day('2026-09-01').should('have.class', 'range-start');
    });
  });

  describe('keyboard', () => {
    it('moves between days with the arrow keys and picks with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      pickTime('start', '09:00:00');
      pickTime('end', '11:00:00');
      day('2026-06-20').focus().type('{enter}');
      cy.focused().type('{downArrow}');
      cy.focused().should('have.attr', 'data-date', '2026-06-27').type('{enter}');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', {
          value: [...june, { start: '2026-06-20T09:00:00', end: '2026-06-27T11:00:00' }],
        });
    });
  });

  describe('states', () => {
    it('ignores picks while read-only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          readonly
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-20').click();
      day('2026-06-21').click();

      day('2026-06-20').should('not.have.class', 'is-anchor');
      cy.get('@change').should('not.have.been.called');
      pills().should('be.disabled');
    });

    it('disables its time pickers and pills', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          disabled
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      picker('start').find('gui-time input[data-type="hour"]').should('be.disabled');
      picker('end').find('gui-time input[data-type="hour"]').should('be.disabled');
      pills().should('be.disabled');
    });

    it('takes every day, the month buttons and the year selector out of reach when disabled', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Shift"
          locale-id="en-US"
          disabled
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-10').should('be.disabled').and('have.attr', 'tabindex', '-1');
      cy.get(`${tag} .gui-calendar__month-button--prev`).should('be.disabled');
      cy.get(`${tag} .gui-calendar__month-button--next`).should('be.disabled');
      cy.get(`${tag} .gui-calendar__year-selector`).should('be.disabled');
      cy.get(`${tag} .gui-calendar__day-button`)
        .filter(':enabled, [tabindex="0"]')
        .should('not.exist');
    });
  });
});
