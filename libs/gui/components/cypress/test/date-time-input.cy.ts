import { html } from 'lit';
import type { GuiDateTime } from '../../src/lib/components/date-time-input';

type PartType = 'month' | 'day' | 'year' | 'hour' | 'minute' | 'dayPeriod';

const part = (type: PartType) => cy.get(`gui-date-time [data-type="${type}"]`);
const element = () => cy.get<GuiDateTime>('gui-date-time');
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-date-time', () => {
  describe('rendering', () => {
    it('renders its value as date and time parts in the locale order', () => {
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
        ></gui-date-time>`,
      );

      cy.get('gui-date-time [data-type]').should(($parts) => {
        expect($parts.toArray().map((el) => el.dataset['type'])).to.deep.equal([
          'month',
          'day',
          'year',
          'hour',
          'minute',
          'dayPeriod',
        ]);
      });
      part('month').should('have.value', '03');
      part('day').should('have.value', '15');
      part('year').should('have.value', '2026');
      part('hour').should('have.value', '02');
      part('minute').should('have.value', '30');
      part('dayPeriod').should('contain.text', 'PM');
    });

    it('uses a 24-hour clock with hour-format and names its parts with the aria-label attributes', () => {
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          hour-format="24"
          value="2026-03-15T14:30:00"
          day-aria-label="Día"
          hour-aria-label="Hora"
          minute-aria-label="Minuto"
        ></gui-date-time>`,
      );

      part('hour').should('have.value', '14').and('have.attr', 'aria-label', 'Hora');
      part('minute').should('have.attr', 'aria-label', 'Minuto');
      part('day').should('have.attr', 'aria-label', 'Día');
      part('dayPeriod').should('not.exist');
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          value="2026-03-15T14:30:00"
        ></gui-date-time>`,
      );

      element().invoke('prop', 'value', '2027-01-02T08:05:00');

      part('month').should('have.value', '01');
      part('day').should('have.value', '02');
      part('year').should('have.value', '2027');
      part('hour').should('have.value', '08');
      part('minute').should('have.value', '05');
      part('dayPeriod').should('contain.text', 'AM');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change with the ISO date-time once every part is typed', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date-time>`,
      );

      part('month').type('03');
      cy.focused().type('15');
      cy.focused().type('2026');
      cy.focused().should('have.attr', 'data-type', 'hour').type('09');
      cy.focused().type('45');

      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-15T09:45:00' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-15T09:45:00' });
      element().should('have.prop', 'value', '2026-03-15T09:45:00');
    });

    it('fires gui-parts-change with each half as it completes', () => {
      const onPartsChange = cy.spy().as('partsChange');
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          @gui-parts-change=${onPartsChange}
        ></gui-date-time>`,
      );

      part('month').type('03');
      cy.focused().type('15');
      cy.focused().type('2026');
      cy.focused().should('have.attr', 'data-type', 'hour').type('0');

      cy.get('@partsChange')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { date: '2026-03-15', time: null });

      cy.focused().type('9');
      cy.focused().type('45');

      cy.get('@partsChange')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { date: '2026-03-15', time: '09:45:00' });
    });

    it('fires gui-focus when a part receives focus and gui-blur when focus leaves the field', () => {
      const onFocus = cy.spy().as('focus');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-date-time
            label="Start"
            locale-id="en-US"
            value="2026-03-15T09:45:00"
            @gui-focus=${onFocus}
            @gui-blur=${onBlur}
          ></gui-date-time>
          <button id="outside">Outside</button>`,
      );

      part('year').focus();
      part('hour').focus();
      cy.get('@focus').should('have.been.calledTwice');
      cy.get('@focus').its('firstCall.args.0.detail').should('be.instanceOf', FocusEvent);
      cy.get('@blur').should('not.have.been.called');

      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('fires its events to an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      const onFocus = cy.spy().as('focus');
      const onPartsChange = cy.spy().as('partsChange');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<div
            @gui-blur=${onBlur}
            @gui-focus=${onFocus}
            @gui-parts-change=${onPartsChange}
            @gui-input-error=${onInputError}
          >
            <gui-date-time
              label="Start"
              locale-id="en-US"
              hour-format="24"
              invalid-date-message="No such day"
            ></gui-date-time>
          </div>
          <button id="outside">Outside</button>`,
      );

      part('month').type('02');
      cy.focused().type('30');
      cy.focused().type('2026');
      cy.focused().type('10');
      cy.focused().type('00');
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@focus').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@partsChange').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'No such day' });
    });

    it('fires gui-input-error for an impossible date', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          hour-format="24"
          invalid-date-message="No such day"
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-date-time>`,
      );

      part('month').type('02');
      cy.focused().type('30');
      cy.focused().type('2026');
      cy.focused().type('10');
      cy.focused().type('00');

      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'No such day' });
      cy.get('@change').should('not.have.been.called');
    });

    it('fires gui-change and gui-input-error for a date-time outside its bounds', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          hour-format="24"
          min-date="2026-03-01"
          max-date="2026-03-31"
          min-time="09:00:00"
          max-time="17:00:00"
          min-time-message="Too early"
          max-date-message="Too late"
          value="2026-03-15T10:00:00"
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-date-time>`,
      );

      part('hour').type('{downArrow}{downArrow}');

      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-15T08:00:00' });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too early' });

      part('month').type('{upArrow}');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
    });

    it('reports a partly typed date-time as incomplete when focus leaves', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date-time
            label="Start"
            locale-id="en-US"
            incomplete-message="Finish it"
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-date-time>
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
  });

  describe('keyboard', () => {
    it('steps the parts with the arrows, the minute by minute-step, and switches AM/PM', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          minute-step="15"
          value="2026-03-15T09:45:00"
          @gui-change=${onChange}
        ></gui-date-time>`,
      );

      part('day').type('{upArrow}');
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-16T09:45:00' });

      part('minute').type('{downArrow}');
      part('minute').should('have.value', '30');

      part('dayPeriod').focus().type('{upArrow}');

      part('dayPeriod').should('contain.text', 'PM');
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-16T21:30:00' });
    });

    it('moves from the date parts to the time parts with the right arrow', () => {
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          value="2026-03-15T09:45:00"
        ></gui-date-time>`,
      );

      part('year').type('{rightArrow}');
      cy.focused().should('have.attr', 'data-type', 'hour').type('{leftArrow}');
      cy.focused().should('have.attr', 'data-type', 'year');
    });
  });

  describe('states', () => {
    it('makes its parts read-only', () => {
      cy.mount(
        html`<gui-date-time
          label="Start"
          locale-id="en-US"
          value="2026-03-15T09:45:00"
          readonly
        ></gui-date-time>`,
      );

      cy.get('gui-date-time [role="spinbutton"]').each(($part) => {
        cy.wrap($part).should('have.attr', 'readonly');
      });
      part('dayPeriod').click();

      part('dayPeriod').should('contain.text', 'AM');
      element().should('have.prop', 'value', '2026-03-15T09:45:00');
    });

    it('disables its parts', () => {
      cy.mount(html`<gui-date-time label="Start" locale-id="en-US" disabled></gui-date-time>`);

      cy.get('gui-date-time [data-type]').each(($part) => {
        cy.wrap($part).should('be.disabled');
      });
    });
  });
});
