import { html } from 'lit';
import type { GuiRangeDateTimePicker } from '../../src/lib/components/range-date-time-picker';

type Group = 'start' | 'end';
type Endpoint = [month: string, day: string, year: string, hour: string, minute: string];

const tag = 'gui-range-date-time-picker';
const element = () => cy.get<GuiRangeDateTimePicker>(tag);
const part = (group: Group, type: string) =>
  cy.get(`${tag} gui-range-date-time [data-group="${group}"][data-type="${type}"]`);
const toggle = () => cy.get(`${tag} button[aria-haspopup="dialog"]`);
const calendar = () => cy.get(`${tag} gui-range-date-time-calendar`);
const day = (date: string) => cy.get(`${tag} .gui-calendar__day-button[data-date="${date}"]`);
/** Asserts, retrying, what the field's numeric parts show. */
const shown = (values: string[]) =>
  cy
    .get(`${tag} gui-range-date-time input`)
    .should(($inputs) =>
      expect($inputs.toArray().map((input) => (input as HTMLInputElement).value)).to.deep.equal(
        values,
      ),
    );

const typeEndpoint = (group: Group, [month, day, year, hour, minute]: Endpoint) => {
  part(group, 'month').click();
  for (const digits of [month, day, year, hour, minute]) cy.focused().type(digits);
};

const june = { start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' };
const juneShown = ['06', '10', '2026', '09', '00', '06', '12', '2026', '17', '00'];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-date-time-picker', () => {
  describe('rendering', () => {
    it('renders its label, its range in the field and a collapsed calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          toggle-aria-label="Open calendar"
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      cy.get(`${tag} .gui-label`).should('contain.text', 'Rental');
      shown(juneShown);
      toggle()
        .should('have.attr', 'aria-label', 'Open calendar')
        .and('have.attr', 'aria-expanded', 'false');
      calendar().should('not.exist');
    });
  });

  describe('picking', () => {
    it('picks two days with the times it shows, fires once and closes the calendar', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          .value=${june}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      toggle().click();
      day('2026-06-16').click();
      part('start', 'day').should('have.value', '16');
      part('end', 'day').should('have.value', '');
      calendar().should('exist');
      day('2026-06-18').click();

      const range = { start: '2026-06-16T09:00:00', end: '2026-06-18T17:00:00' };
      calendar().should('not.exist');
      shown(['06', '16', '2026', '09', '00', '06', '18', '2026', '17', '00']);
      element().should(([el]) => {
        expect(onInput).to.have.been.calledOnceWith(dispatchedBy(el));
        expect(onChange).to.have.been.calledOnceWith(dispatchedBy(el));
      });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: range });
    });

    it('drops an unfinished pick with Escape and shows the range again, then closes', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      toggle().click();
      day('2026-06-16').click();
      cy.focused().type('{esc}');

      shown(juneShown);
      calendar().should('exist');
      cy.focused().type('{esc}');
      calendar().should('not.exist');
    });

    it('drops an unfinished pick when focus leaves, with no error', () => {
      const onInputError = cy.spy().as('inputError');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-date-time-picker
            label="Rental"
            locale-id="en-US"
            hour-format="24"
            .value=${june}
            @gui-input-error=${onInputError}
            @gui-blur=${onBlur}
          ></gui-range-date-time-picker>
          <button id="outside">Outside</button>`,
      );

      toggle().click();
      day('2026-06-16').click();
      part('end', 'month').focus();
      cy.get('#outside').focus();

      shown(juneShown);
      element().should('have.prop', 'value').and('deep.equal', june);
      cy.get('@inputError').should('not.have.been.called');
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('rejects a picked range over a disabled span, and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          disabled-range-message="The shop is closed then"
          .disabledRanges=${[{ start: '2026-06-17T12:00:00', end: '2026-06-17T13:00:00' }]}
          .value=${june}
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-range-date-time-picker>`,
      );

      toggle().click();
      day('2026-06-16').click();
      day('2026-06-18').click();

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'The shop is closed then' });
      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value').and('deep.equal', june);
    });
  });

  describe('typing', () => {
    it('sets a typed range', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      typeEndpoint('start', ['06', '10', '2026', '09', '00']);
      typeEndpoint('end', ['06', '12', '2026', '17', '00']);

      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: june });
    });

    it('reports a half-typed range as incomplete when focus leaves, and clears the value', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-time-picker
            label="Rental"
            locale-id="en-US"
            hour-format="24"
            incomplete-message="Finish the range"
            .value=${june}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-range-date-time-picker>
          <button id="outside">Outside</button>`,
      );

      part('end', 'minute').click();
      cy.focused().type('{selectall}{backspace}');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
    });
  });

  describe('states', () => {
    it('disables its fields and its calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Rental"
          disabled
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      toggle().should('be.disabled');
      cy.get(`${tag} gui-range-date-time input`).each(($input) =>
        cy.wrap($input).should('be.disabled'),
      );
    });
  });
});
