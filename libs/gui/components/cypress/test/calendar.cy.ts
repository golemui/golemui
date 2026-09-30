import { html } from 'lit';
import type { GuiCalendar } from '../../src/lib/components/calendar';

const day = (date: string) => cy.get(`gui-calendar [data-date="${date}"]`);
const element = () => cy.get<GuiCalendar>('gui-calendar');
const weekdays = () =>
  cy
    .get('gui-calendar .gui-calendar__weekday')
    .then(($weekdays) => $weekdays.toArray().map((weekday) => weekday.textContent));
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-calendar', () => {
  describe('rendering', () => {
    it('renders the month of its value with the selected day', () => {
      cy.mount(
        html`<gui-calendar label="Day" locale-id="en-US" value="2026-03-15"></gui-calendar>`,
      );

      cy.get('gui-calendar .gui-calendar__month-name').should('have.text', 'March');
      cy.get('gui-calendar .gui-calendar__year-value').should('have.text', '2026');
      cy.get('gui-calendar [role="grid"]').should('have.attr', 'aria-label', 'March 2026');
      day('2026-03-15')
        .should('have.attr', 'aria-selected', 'true')
        .and('have.attr', 'tabindex', '0')
        .and('have.attr', 'aria-label', 'Sunday, March 15, 2026');
      day('2026-03-16').should('have.attr', 'aria-selected', 'false');
    });

    it('disables the days outside min-date and max-date and inside disabled-ranges', () => {
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          min-date="2026-03-05"
          max-date="2026-03-25"
          disabled-ranges='[{"start":"2026-03-10","end":"2026-03-12"}]'
        ></gui-calendar>`,
      );

      day('2026-03-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-11').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-26').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-13').should('not.have.attr', 'aria-disabled');
      cy.get('gui-calendar .gui-calendar__month-button--prev').should('be.disabled');
      cy.get('gui-calendar .gui-calendar__month-button--next').should('be.disabled');
    });

    it('renders number-of-months months side by side in the month-format', () => {
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          number-of-months="2"
          month-format="short"
        ></gui-calendar>`,
      );

      cy.get('gui-calendar .gui-calendar__panel').should('have.length', 2);
      cy.get('gui-calendar .gui-calendar__month-name').then(($names) => {
        expect($names.toArray().map((el) => el.textContent)).to.deep.equal(['Mar', 'Apr']);
      });
      day('2026-04-30').should('exist');
    });

    it('writes numeric days and narrow weekday names by default', () => {
      cy.mount(
        html`<gui-calendar label="Day" locale-id="en-US" value="2026-03-15"></gui-calendar>`,
      );

      day('2026-03-05').invoke('text').invoke('trim').should('equal', '5');
      weekdays().should('deep.equal', ['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    });

    it('writes the days in day-format and the weekday names in weekday-format', () => {
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          day-format="2-digit"
          weekday-format="short"
        ></gui-calendar>`,
      );

      day('2026-03-05').invoke('text').invoke('trim').should('equal', '05');
      weekdays().should('deep.equal', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('moves to the month of a value set from outside', () => {
      cy.mount(
        html`<gui-calendar label="Day" locale-id="en-US" value="2026-03-15"></gui-calendar>`,
      );

      element().invoke('prop', 'value', '2026-07-04');

      cy.get('gui-calendar .gui-calendar__month-name').should('have.text', 'July');
      day('2026-07-04').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when a day is picked', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-calendar>`,
      );

      day('2026-03-20').click();

      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: '2026-03-20' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-20' });
      element().should('have.prop', 'value', '2026-03-20');
      day('2026-03-20').should('have.attr', 'aria-selected', 'true');
    });

    it('ignores a click on a disabled day', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          max-date="2026-03-20"
          @gui-change=${onChange}
        ></gui-calendar>`,
      );

      day('2026-03-25').click();

      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value', '2026-03-15');
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-calendar
            label="Day"
            locale-id="en-US"
            value="2026-03-15"
            @gui-blur=${onBlur}
          ></gui-calendar>
          <button id="outside">Outside</button>`,
      );

      day('2026-03-15').focus();
      day('2026-03-16').focus();
      cy.get('@blur').should('not.have.been.called');

      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('fires gui-blur to an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<div @gui-blur=${onBlur}>
            <gui-calendar label="Day" locale-id="en-US" value="2026-03-15"></gui-calendar>
          </div>
          <button id="outside">Outside</button>`,
      );

      day('2026-03-15').focus();
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
    });
  });

  describe('keyboard', () => {
    it('moves through the days with the arrow keys, into the next month', () => {
      cy.mount(
        html`<gui-calendar label="Day" locale-id="en-US" value="2026-03-15"></gui-calendar>`,
      );

      day('2026-03-15').focus().type('{rightArrow}');
      cy.focused().should('have.attr', 'data-date', '2026-03-16');
      cy.focused().type('{downArrow}');
      cy.focused().should('have.attr', 'data-date', '2026-03-23');
      cy.focused().type('{downArrow}{downArrow}');

      cy.focused().should('have.attr', 'data-date', '2026-04-06');
      cy.get('gui-calendar .gui-calendar__month-name').should('have.text', 'April');
    });

    it('picks the focused day with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          @gui-change=${onChange}
        ></gui-calendar>`,
      );

      day('2026-03-15').focus().type('{leftArrow}{enter}');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-14' });
    });

    it('picks a year from the year grid and closes it with Escape', () => {
      cy.mount(
        html`<gui-calendar label="Day" locale-id="en-US" value="2026-03-15"></gui-calendar>`,
      );

      cy.get('gui-calendar .gui-calendar__year-selector').click();
      cy.focused().should('have.attr', 'data-year', '2026');
      cy.focused().type('{rightArrow}{enter}');

      cy.get('gui-calendar .gui-calendar__year-value').should('have.text', '2027');
      cy.get('gui-calendar .gui-calendar__month-name').should('have.text', 'March');

      cy.get('gui-calendar .gui-calendar__year-selector').click();
      cy.focused().type('{esc}');

      cy.get('gui-calendar .gui-calendar__year-grid').should('not.exist');
      cy.focused().should('have.class', 'gui-calendar__year-selector');
    });
  });

  describe('states', () => {
    it('keeps its value when read-only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          readonly
          @gui-change=${onChange}
        ></gui-calendar>`,
      );

      day('2026-03-20').click();

      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value', '2026-03-15');
    });

    it('marks itself disabled and ignores picks', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          disabled
          @gui-change=${onChange}
        ></gui-calendar>`,
      );

      cy.get('gui-calendar [role="group"]').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-20').click({ force: true });

      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value', '2026-03-15');
    });

    it('takes every day, the month buttons and the year selector out of reach when disabled', () => {
      cy.mount(
        html`<gui-calendar
          label="Day"
          locale-id="en-US"
          value="2026-03-15"
          disabled
        ></gui-calendar>`,
      );

      day('2026-03-15').should('be.disabled').and('have.attr', 'tabindex', '-1');
      cy.get('gui-calendar .gui-calendar__month-button--prev').should('be.disabled');
      cy.get('gui-calendar .gui-calendar__month-button--next').should('be.disabled');
      cy.get('gui-calendar .gui-calendar__year-selector').should('be.disabled');
      cy.get('gui-calendar button:enabled, gui-calendar [tabindex="0"]').should('not.exist');
    });
  });
});
