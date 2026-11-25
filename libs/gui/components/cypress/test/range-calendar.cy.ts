import { html } from 'lit';
import { configureMessages, type GuiMessageKey } from '../../src/index';
import type { GuiRangeCalendar } from '../../src/lib/components/range-calendar';

const element = () => cy.get<GuiRangeCalendar>('gui-range-calendar');
const day = (date: string) => cy.get(`gui-range-calendar [data-date="${date}"]`);
/** Asserts, retrying, which days the calendar paints as part of a range. */
const painted = (dates: string[]) =>
  cy
    .get('gui-range-calendar')
    .should(([el]) =>
      expect(
        [...el.querySelectorAll<HTMLElement>('.range-start, .in-range, .range-end')].map(
          (button) => button.dataset['date'],
        ),
      ).to.deep.equal(dates),
    );

const march = { start: '2026-03-02', end: '2026-03-06' };
const disabled = [{ start: '2026-03-09', end: '2026-03-11' }];

describe('gui-range-calendar', () => {
  describe('rendering', () => {
    it('renders its label and paints its range at the month of its start', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          .value=${march}
        ></gui-range-calendar>`,
      );

      cy.get('gui-range-calendar .gui-calendar-input')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Trip'));
      day('2026-03-02').should('have.class', 'range-start');
      day('2026-03-04').should('have.class', 'in-range');
      day('2026-03-06').should('have.class', 'range-end');
      cy.get('gui-range-calendar gui-pills').should('not.exist');
    });

    it('reads a value without both ends as empty', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          name="trip"
          required
          .value=${{ start: '2026-03-02' }}
        ></gui-range-calendar>`,
      );

      painted([]);
      element().should(([el]) => expect(el.validity?.valueMissing).to.equal(true));
    });

    it('marks the days outside min-date and max-date and inside disabled-ranges', () => {
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          min-date="2026-03-02"
          max-date="2026-03-27"
          .disabledRanges=${disabled}
          .value=${march}
        ></gui-range-calendar>`,
      );

      day('2026-03-01').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-10').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-28').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-12').should('not.have.attr', 'aria-disabled');
    });
  });

  describe('picking', () => {
    it('starts a pick on the first click, hiding the range, and fires nothing', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          .value=${march}
          @gui-input=${onInput}
        ></gui-range-calendar>`,
      );

      day('2026-03-16').click();

      day('2026-03-16').should('have.class', 'is-anchor');
      painted([]);
      cy.get('@input').should('not.have.been.called');
      element().should('have.prop', 'value').and('deep.equal', march);
    });

    it('sets the range on the second click and fires gui-input and gui-change once', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          .value=${march}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-03-16').click();
      day('2026-03-19').click();

      const range = { start: '2026-03-16', end: '2026-03-19' };
      cy.get('@input').should('have.been.calledOnce');
      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: range });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: range });
      painted(['2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19']);
    });

    it('orders a range picked end first, and takes one day as a range of one day', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          .value=${march}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-03-19').click();
      day('2026-03-16').click();
      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should('deep.equal', { start: '2026-03-16', end: '2026-03-19' });

      day('2026-03-24').click();
      day('2026-03-24').click();
      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should('deep.equal', { start: '2026-03-24', end: '2026-03-24' });
    });

    it('rejects a range over a disabled day, keeps its value and fires gui-input-error', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          disabled-date-range-message="Closed those days"
          .disabledRanges=${disabled}
          .value=${march}
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-range-calendar>`,
      );

      day('2026-03-05').click();
      day('2026-03-12').click();

      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', {
          message: 'Closed those days',
          range: { start: '2026-03-05', end: '2026-03-12' },
        });
      cy.get('@change').should('not.have.been.called');
      day('2026-03-05').should('have.class', 'invalid-range-start');
      day('2026-03-12').should('have.class', 'invalid-range-end');
      element().should('have.prop', 'value').and('deep.equal', march);
    });

    it('drops an unfinished pick when focus leaves, and paints the range again', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-calendar
            label="Trip"
            locale-id="en-US"
            .value=${march}
            @gui-input=${onInput}
          ></gui-range-calendar>
          <button id="outside">Outside</button>`,
      );

      day('2026-03-16').click();
      cy.get('#outside').focus();

      day('2026-03-16').should('not.have.class', 'is-anchor');
      painted(['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06']);
      cy.get('@input').should('not.have.been.called');
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-calendar
            label="Trip"
            locale-id="en-US"
            .value=${march}
            @gui-blur=${onBlur}
          ></gui-range-calendar>
          <button id="outside">Outside</button>`,
      );

      day('2026-03-16').focus();
      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
    });
  });

  describe('keyboard', () => {
    it('picks a range with Enter and drops an unfinished one with Escape', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-calendar
          label="Trip"
          locale-id="en-US"
          .value=${march}
          @gui-change=${onChange}
        ></gui-range-calendar>`,
      );

      day('2026-03-02').focus();
      cy.focused().type('{rightarrow}{enter}');
      day('2026-03-03').should('have.class', 'is-anchor');
      cy.focused().type('{esc}');
      day('2026-03-03').should('not.have.class', 'is-anchor');
      day('2026-03-02').should('have.class', 'range-start');

      cy.focused().type('{enter}{rightarrow}{rightarrow}{enter}');
      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should('deep.equal', { start: '2026-03-03', end: '2026-03-05' });
    });

    it('lets Escape go on when no pick is unfinished', () => {
      const onKeydown = cy.spy().as('keydown');
      cy.mount(
        html`<div @keydown=${onKeydown}>
          <gui-range-calendar label="Trip" locale-id="en-US" .value=${march}></gui-range-calendar>
        </div>`,
      );

      day('2026-03-02').focus();
      cy.focused().type('{esc}');

      cy.get('@keydown').should('have.been.called');
    });
  });

  describe('states', () => {
    it('ignores picks while read-only and disables its days while disabled', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-calendar
            label="Trip"
            locale-id="en-US"
            readonly
            .value=${march}
            @gui-input=${onInput}
          ></gui-range-calendar>
          <gui-range-calendar
            id="disabled"
            label="Return"
            locale-id="en-US"
            disabled
            .value=${march}
          ></gui-range-calendar>`,
      );

      cy.get('gui-range-calendar[readonly] [data-date="2026-03-16"]').click();
      cy.get('gui-range-calendar[readonly] [data-date="2026-03-19"]').click();
      cy.get('@input').should('not.have.been.called');
      cy.get('#disabled [data-date="2026-03-16"]').should('be.disabled');
    });

    it('flips its month arrows in a right-to-left context', () => {
      cy.mount(
        html`<div dir="rtl">
          <gui-range-calendar label="Trip" locale-id="en-US" .value=${march}></gui-range-calendar>
        </div>`,
      );

      cy.get('gui-range-calendar .gui-calendar__month-button')
        .first()
        .should('have.css', 'transform', 'matrix(-1, 0, 0, 1, 0, 0)');
    });

    it('takes its month button names from the configured messages', () => {
      const spanish: Partial<Record<GuiMessageKey, string>> = {
        previousMonth: 'Mes anterior',
        nextMonth: 'Mes siguiente',
        disabledDateRange: 'Hay días cerrados',
      };
      configureMessages((key) => spanish[key]);
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-calendar
          label="Viaje"
          locale-id="es"
          .disabledRanges=${disabled}
          .value=${march}
          @gui-input-error=${onInputError}
        ></gui-range-calendar>`,
      );

      cy.get('gui-range-calendar [aria-label="Mes anterior"]').should('exist');
      cy.get('gui-range-calendar [aria-label="Mes siguiente"]').should('exist');
      day('2026-03-05').click();
      day('2026-03-12').click();
      cy.get('@inputError')
        .its('firstCall.args.0.detail.message')
        .should('equal', 'Hay días cerrados');
      cy.then(() => configureMessages(null));
    });
  });
});
