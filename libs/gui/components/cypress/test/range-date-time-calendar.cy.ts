import { html } from 'lit';
import type { GuiRangeDateTimeCalendar } from '../../src/lib/components/range-date-time-calendar';

type Endpoint = 'start' | 'end';

const tag = 'gui-range-date-time-calendar';
const element = () => cy.get<GuiRangeDateTimeCalendar>(tag);
const day = (date: string) => cy.get(`${tag} .gui-calendar__day-button[data-date="${date}"]`);
const picker = (endpoint: Endpoint) =>
  cy.get(`${tag} gui-time-picker.gui-range-date-time-calendar__${endpoint}`);
const pickTime = (endpoint: Endpoint, time: string) => {
  picker(endpoint).find('gui-time input[data-type="hour"]').click();
  picker(endpoint).find(`.gui-time-list__option[data-value="${time}"]`).click();
};
/** Asserts, retrying, which days the calendar paints as part of a range. */
const painted = (dates: string[]) =>
  cy
    .get(tag)
    .should(([el]) =>
      expect(
        [...el.querySelectorAll<HTMLElement>('.range-start, .in-range, .range-end')].map(
          (button) => button.dataset['date'],
        ),
      ).to.deep.equal(dates),
    );

const june = { start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' };

describe('gui-range-date-time-calendar', () => {
  describe('rendering', () => {
    it('paints its range, shows its times in the time pickers, and has no pills', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Rental"
          locale-id="en-US"
          start-time-label="Pick-up"
          end-time-label="Return"
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      picker('start').should('contain.text', 'Pick-up');
      picker('end').should('contain.text', 'Return');
      picker('start').should('have.prop', 'value', '09:00:00');
      picker('end').should('have.prop', 'value', '17:00:00');
      painted(['2026-06-10', '2026-06-11', '2026-06-12']);
      cy.get(`${tag} gui-pills`).should('not.exist');
    });

    it('badges a day with disabled times, but not a day with its range', () => {
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Rental"
          locale-id="en-US"
          .disabledRanges=${[{ start: '2026-06-15T12:00:00', end: '2026-06-15T13:00:00' }]}
          .value=${june}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-15')
        .find('.gui-range-date-time-calendar__disabled-count')
        .should('have.text', '1');
      day('2026-06-10').find('.gui-range-date-time-calendar__day-count').should('not.exist');
    });
  });

  describe('picking', () => {
    it('picks new days with the times it shows: the second click sets the value', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Rental"
          locale-id="en-US"
          .value=${june}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-16').click();
      painted([]);
      day('2026-06-16').should('have.class', 'is-anchor');
      cy.get('@input').should('not.have.been.called');
      day('2026-06-18').click();

      const range = { start: '2026-06-16T09:00:00', end: '2026-06-18T17:00:00' };
      cy.get('@input').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: range });
      painted(['2026-06-16', '2026-06-17', '2026-06-18']);
      picker('start').should('have.prop', 'value', '09:00:00');
    });

    it('changes only a time when a time is picked with no days being picked', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Rental"
          locale-id="en-US"
          minute-step="60"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-time-calendar>`,
      );

      pickTime('end', '18:00:00');

      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should('deep.equal', { start: '2026-06-10T09:00:00', end: '2026-06-12T18:00:00' });
    });

    it('needs both times on an empty calendar, in any order', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Rental"
          locale-id="en-US"
          minute-step="60"
          @gui-change=${onChange}
          .focusDate=${'2026-06-01'}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-16').click();
      day('2026-06-18').click();
      cy.get('@change').should('not.have.been.called');
      pickTime('start', '10:00:00');
      pickTime('end', '12:00:00');

      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should('deep.equal', { start: '2026-06-16T10:00:00', end: '2026-06-18T12:00:00' });
    });

    it('drops an unfinished pick with Escape, and when focus leaves', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-date-time-calendar
            label="Rental"
            locale-id="en-US"
            .value=${june}
            @gui-input=${onInput}
          ></gui-range-date-time-calendar>
          <button id="outside">Outside</button>`,
      );

      day('2026-06-16').click();
      cy.focused().type('{esc}');
      day('2026-06-16').should('not.have.class', 'is-anchor');
      painted(['2026-06-10', '2026-06-11', '2026-06-12']);

      day('2026-06-16').click();
      cy.get('#outside').focus();
      painted(['2026-06-10', '2026-06-11', '2026-06-12']);
      cy.get('@input').should('not.have.been.called');
      element().should('have.prop', 'value').and('deep.equal', june);
    });

    it('rejects a range over a disabled span, and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Rental"
          locale-id="en-US"
          disabled-range-message="The shop is closed then"
          .disabledRanges=${[{ start: '2026-06-17T12:00:00', end: '2026-06-17T13:00:00' }]}
          .value=${june}
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-16').click();
      day('2026-06-18').click();

      cy.get('@inputError')
        .its('lastCall.args.0.detail.message')
        .should('equal', 'The shop is closed then');
      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value').and('deep.equal', june);
    });
  });

  describe('states', () => {
    it('ignores picks while read-only', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-date-time-calendar
          label="Rental"
          locale-id="en-US"
          readonly
          .value=${june}
          @gui-input=${onInput}
        ></gui-range-date-time-calendar>`,
      );

      day('2026-06-16').click();
      day('2026-06-18').click();
      cy.get('@input').should('not.have.been.called');
    });

    it('submits its range as JSON with a form', () => {
      cy.mount(
        html`<form>
          <gui-range-date-time-calendar
            label="Rental"
            name="rental"
            locale-id="en-US"
            .value=${june}
          ></gui-range-date-time-calendar>
        </form>`,
      );

      cy.get('form').should(([form]) =>
        expect(new FormData(form as HTMLFormElement).get('rental')).to.equal(JSON.stringify(june)),
      );
    });
  });
});
