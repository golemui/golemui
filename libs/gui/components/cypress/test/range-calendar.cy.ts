import { html } from 'lit';
import type { GuiRangeCalendar } from '../../src/lib/components/range-calendar';

const element = () => cy.get<GuiRangeCalendar>('gui-range-calendar');
const day = (date: string) => cy.get(`gui-range-calendar [data-date="${date}"]`);
const pills = () => cy.get('gui-range-calendar .gui-pills__pill');
const weekdays = () =>
  cy
    .get('gui-range-calendar .gui-calendar__weekday')
    .then(($weekdays) => $weekdays.toArray().map((weekday) => weekday.textContent));

const june = [{ start: '2026-06-10', end: '2026-06-12' }];

describe('gui-range-calendar', () => {
  describe('rendering', () => {
    it('renders its attributes and the month of its first range', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          number-of-months="2"
          .value=${june}
        ></gui-range-calendar>`,
      );

      cy.get('gui-range-calendar .gui-calendar__panel').should('have.length', 2);
      cy.get('gui-range-calendar .gui-calendar-input')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Stay'));
      day('2026-06-10').should('have.class', 'range-start');
      day('2026-06-11').should('have.class', 'in-range');
      day('2026-06-12').should('have.class', 'range-end');
      day('2026-07-15').should('exist');
    });

    it('renders a pill per range with its remove hint', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          remove-pill-aria-label="Drop range"
          .value=${[...june, { start: '2026-06-20', end: '2026-06-22' }]}
        ></gui-range-calendar>`,
      );

      pills().should('have.length', 2);
      pills().first().should('contain.text', '06/10/2026 - 06/12/2026');
      pills().last().should('contain.text', '06/20/2026 - 06/22/2026');
      pills().first().should('have.attr', 'aria-description', 'Drop range');
    });

    it('writes the days in day-format and the weekday names in weekday-format', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          day-format="2-digit"
          weekday-format="short"
          .value=${june}
        ></gui-range-calendar>`,
      );

      day('2026-06-05').invoke('text').invoke('trim').should('equal', '05');
      weekdays().should('deep.equal', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('disables the days outside min-date and max-date', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          min-date="2026-06-05"
          max-date="2026-06-25"
          .value=${june}
        ></gui-range-calendar>`,
      );

      day('2026-06-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-06-05').should('not.have.attr', 'aria-disabled');
      day('2026-06-25').should('not.have.attr', 'aria-disabled');
      day('2026-06-26').should('have.attr', 'aria-disabled', 'true');
    });
  });

  describe('value', () => {
    it('fires gui-parts-change on the first pick and gui-input and gui-change on the second', () => {
      const onParts = cy.spy().as('parts');
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          .value=${june}
          @gui-parts-change=${onParts}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-06-20').click();

      cy.get('@parts')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { anchor: '2026-06-20', start: null, end: null });
      cy.get('@change').should('not.have.been.called');

      day('2026-06-22').click();

      const value = [...june, { start: '2026-06-20', end: '2026-06-22' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('have.length', 2);
      element().should(([el]) => expect(el.value).to.deep.equal(value));
    });

    it('fires gui-change without the range whose pill is removed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          .value=${[...june, { start: '2026-06-20', end: '2026-06-22' }]}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      cy.get('gui-range-calendar .gui-pills__pill-remove').first().click();

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: [{ start: '2026-06-20', end: '2026-06-22' }] });
      pills().should('have.length', 1);
    });

    it('fires gui-input-error for a range that spans a disabled date', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          disabled-ranges='[{"start":"2026-06-17","end":"2026-06-18"}]'
          .value=${june}
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-06-15').click();
      day('2026-06-20').click();

      cy.get('@error').should('have.been.calledOnce');
      cy.get('@error')
        .its('firstCall.args.0.detail.message')
        .should('equal', 'Invalid date: date is within a disabled range.');
      cy.get('@change').should('not.have.been.called');
      day('2026-06-15').should('have.class', 'invalid-range-start');
      pills().should('have.length', 1);
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-calendar
            label="Stay"
            locale-id="en-US"
            .value=${june}
            @gui-blur=${onBlur}
          ></gui-range-calendar>
          <button>Next</button>`,
      );

      day('2026-06-10').focus();
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          .value=${june}
        ></gui-range-calendar>`,
      );

      element().invoke('prop', 'value', [{ start: '2026-09-01', end: '2026-09-03' }]);

      pills().should('have.length', 1).and('contain.text', '09/01/2026 - 09/03/2026');
      day('2026-09-01').should('have.class', 'range-start');
    });
  });

  describe('keyboard', () => {
    it('moves between days with the arrow keys and picks with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-06-20').focus().type('{enter}');
      cy.focused().type('{rightArrow}');
      cy.focused().should('have.attr', 'data-date', '2026-06-21');
      cy.focused().type('{downArrow}');
      cy.focused().should('have.attr', 'data-date', '2026-06-28').type('{enter}');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: [...june, { start: '2026-06-20', end: '2026-06-28' }] });
    });

    it('removes a range with Delete on its pill', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      pills().first().focus().type('{del}');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });
  });

  describe('states', () => {
    it('ignores picks and locks its pills while read-only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          readonly
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-06-20').click();
      day('2026-06-22').click();

      cy.get('@change').should('not.have.been.called');
      pills().should('have.length', 1).and('be.disabled');
    });

    it('ignores picks and disables its pills while disabled', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          disabled
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-06-20').click({ force: true });
      day('2026-06-22').click({ force: true });

      cy.get('@change').should('not.have.been.called');
      cy.get('gui-range-calendar .gui-calendar-input').should('have.attr', 'aria-disabled', 'true');
      pills().should('be.disabled');
    });

    it('takes every day, the month buttons and the year selector out of reach when disabled', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Stay"
          locale-id="en-US"
          disabled
          .value=${june}
        ></gui-range-calendar>`,
      );

      day('2026-06-10').should('be.disabled').and('have.attr', 'tabindex', '-1');
      cy.get('gui-range-calendar .gui-calendar__month-button--prev').should('be.disabled');
      cy.get('gui-range-calendar .gui-calendar__month-button--next').should('be.disabled');
      cy.get('gui-range-calendar .gui-calendar__year-selector').should('be.disabled');
      cy.get('gui-range-calendar button:enabled, gui-range-calendar [tabindex="0"]').should(
        'not.exist',
      );
    });
  });
});
