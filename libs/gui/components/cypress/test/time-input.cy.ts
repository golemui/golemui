import { html } from 'lit';
import type { GuiTime } from '../../src/lib/components/time-input';

const part = (type: 'hour' | 'minute' | 'dayPeriod') => cy.get(`gui-time [data-type="${type}"]`);
const element = () => cy.get<GuiTime>('gui-time');
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-time', () => {
  describe('rendering', () => {
    it('renders its value as hour, minute and AM/PM in a 12-hour locale', () => {
      cy.mount(html`<gui-time label="At" locale-id="en-US" value="14:30:00"></gui-time>`);

      part('hour').should('have.value', '02');
      part('minute').should('have.value', '30');
      part('dayPeriod').should('contain.text', 'PM');
    });

    it('uses a 24-hour clock with hour-format', () => {
      cy.mount(
        html`<gui-time label="At" locale-id="en-US" hour-format="24" value="14:30:00"></gui-time>`,
      );

      part('hour').should('have.value', '14').and('have.attr', 'aria-valuemax', '23');
      part('dayPeriod').should('not.exist');
    });

    it('names each part with its aria-label attribute', () => {
      cy.mount(
        html`<gui-time
          label="At"
          locale-id="en-US"
          hour-aria-label="Hora"
          minute-aria-label="Minuto"
          day-period-aria-label="Periodo"
        ></gui-time>`,
      );

      part('hour').should('have.attr', 'aria-label', 'Hora');
      part('minute').should('have.attr', 'aria-label', 'Minuto');
      part('dayPeriod').should('have.attr', 'aria-label', 'Periodo');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-time label="At" locale-id="en-US" value="14:30:00"></gui-time>`);

      element().invoke('prop', 'value', '08:05:00');

      part('hour').should('have.value', '08');
      part('minute').should('have.value', '05');
      part('dayPeriod').should('contain.text', 'AM');
    });
  });

  describe('value', () => {
    it('fires gui-input, gui-change and gui-parts-change with the ISO time once it is typed', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      const onPartsChange = cy.spy().as('partsChange');
      cy.mount(
        html`<gui-time
          label="At"
          locale-id="en-US"
          @gui-input=${onInput}
          @gui-change=${onChange}
          @gui-parts-change=${onPartsChange}
        ></gui-time>`,
      );

      part('hour').type('09');
      cy.focused().should('have.attr', 'data-type', 'minute').type('45');

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: '09:45:00' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: '09:45:00' });
      cy.get('@partsChange')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { time: '09:45:00' });
      element().should('have.prop', 'value', '09:45:00');
    });

    it('fires gui-focus when a part receives focus and gui-blur when focus leaves the field', () => {
      const onFocus = cy.spy().as('focus');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-time
            label="At"
            locale-id="en-US"
            value="09:45:00"
            @gui-focus=${onFocus}
            @gui-blur=${onBlur}
          ></gui-time>
          <button id="outside">Outside</button>`,
      );

      part('hour').focus();
      part('minute').focus();
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
            <gui-time
              label="At"
              locale-id="en-US"
              hour-format="24"
              min-time="09:00:00"
              min-time-message="Too early"
            ></gui-time>
          </div>
          <button id="outside">Outside</button>`,
      );

      part('hour').type('08');
      cy.focused().type('30');
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@focus').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@partsChange').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Too early' });
    });

    it('fires gui-change and gui-input-error for a time outside min-time and max-time', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-time
          label="At"
          locale-id="en-US"
          hour-format="24"
          min-time="09:00:00"
          max-time="17:00:00"
          min-time-message="Too early"
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-time>`,
      );

      part('hour').type('08');
      cy.focused().type('30');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: '08:30:00' });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Too early' });
    });

    it('reports a partly typed time as incomplete when focus leaves', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-time
            label="At"
            locale-id="en-US"
            incomplete-message="Finish the time"
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-time>
          <button id="outside">Outside</button>`,
      );

      part('hour').type('09');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the time' });
      part('hour').should('have.value', '09');
    });
  });

  describe('keyboard', () => {
    it('steps the hour by one and the minute by minute-step with the arrows', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-time
          label="At"
          locale-id="en-US"
          hour-format="24"
          minute-step="15"
          value="09:45:00"
          @gui-change=${onChange}
        ></gui-time>`,
      );

      part('hour').type('{upArrow}');
      part('hour').should('have.value', '10');
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: '10:45:00' });

      part('minute').type('{upArrow}');

      part('minute').should('have.value', '00');
      element().should('have.prop', 'value', '10:00:00');
    });

    it('switches AM and PM with a click or the arrows, shifting the value by twelve hours', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-time
          label="At"
          locale-id="en-US"
          value="09:45:00"
          @gui-change=${onChange}
        ></gui-time>`,
      );

      part('dayPeriod').click();

      part('dayPeriod').should('contain.text', 'PM');
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: '21:45:00' });

      part('dayPeriod').type('{downArrow}');

      part('dayPeriod').should('contain.text', 'AM');
      element().should('have.prop', 'value', '09:45:00');
    });

    it('moves between parts with the left and right arrows', () => {
      cy.mount(html`<gui-time label="At" locale-id="en-US" value="09:45:00"></gui-time>`);

      part('hour').type('{rightArrow}');
      cy.focused().should('have.attr', 'data-type', 'minute').type('{rightArrow}');
      cy.focused().should('have.attr', 'data-type', 'dayPeriod').type('{leftArrow}');
      cy.focused().should('have.attr', 'data-type', 'minute');
    });
  });

  describe('states', () => {
    it('makes its parts read-only and keeps AM/PM', () => {
      cy.mount(html`<gui-time label="At" locale-id="en-US" value="09:45:00" readonly></gui-time>`);

      part('hour').should('have.attr', 'readonly');
      part('minute').should('have.attr', 'readonly');
      part('dayPeriod').click();

      part('dayPeriod').should('contain.text', 'AM');
      element().should('have.prop', 'value', '09:45:00');
    });

    it('disables its parts', () => {
      cy.mount(html`<gui-time label="At" locale-id="en-US" disabled></gui-time>`);

      part('hour').should('be.disabled');
      part('minute').should('be.disabled');
      part('dayPeriod').should('be.disabled');
    });
  });
});
