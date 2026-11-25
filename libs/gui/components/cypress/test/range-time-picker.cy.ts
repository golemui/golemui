import { html } from 'lit';
import type { GuiRangeTimePicker } from '../../src/lib/components/range-time-picker';

type Group = 'start' | 'end';

const tag = 'gui-range-time-picker';
const element = () => cy.get<GuiRangeTimePicker>(tag);
const part = (group: Group, type: string) =>
  cy.get(`${tag} gui-range-time [data-group="${group}"][data-type="${type}"]`);
const toggle = () => cy.get(`${tag} button[aria-haspopup="dialog"]`);
const panel = () => cy.get(`${tag} .gui-range-time-picker__panel`);
const option = (group: Group, time: string) =>
  cy.get(
    `${tag} .gui-range-time-picker__column:${group === 'start' ? 'first' : 'last'}-child .gui-time-list__option[data-value="${time}"]`,
  );
/** Asserts, retrying, what the field's hour and minute parts show. */
const shown = (values: string[]) =>
  cy
    .get(`${tag} input[data-type="hour"], ${tag} input[data-type="minute"]`)
    .should(($inputs) =>
      expect($inputs.toArray().map((input) => (input as HTMLInputElement).value)).to.deep.equal(
        values,
      ),
    );

const morning = { start: '09:00:00', end: '12:00:00' };
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-time-picker', () => {
  describe('rendering', () => {
    it('renders its label, its range in the field and a collapsed list toggle', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          toggle-aria-label="Open times"
          .value=${morning}
        ></gui-range-time-picker>`,
      );

      cy.get(`${tag} .gui-label`).should('contain.text', 'Opening hours');
      shown(['09', '00', '12', '00']);
      toggle()
        .should('have.attr', 'aria-label', 'Open times')
        .and('have.attr', 'aria-expanded', 'false');
      panel().should('not.exist');
    });

    it('opens two lists that show its range, and offers only later times for the end', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          minute-step="30"
          .value=${morning}
        ></gui-range-time-picker>`,
      );

      toggle().click();

      option('start', '09:00:00').should('have.attr', 'aria-selected', 'true');
      option('end', '12:00:00').should('have.attr', 'aria-selected', 'true');
      option('end', '09:00:00').should('not.exist');
      option('end', '09:30:00').should('exist');
    });
  });

  describe('picking', () => {
    it('starts a new range with a start, emptying the end, and fires nothing', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          minute-step="30"
          .value=${morning}
          @gui-input=${onInput}
        ></gui-range-time-picker>`,
      );

      toggle().click();
      option('start', '13:00:00').click();

      shown(['13', '00', '', '']);
      option('end', '12:00:00').should('not.exist');
      panel().should('exist');
      cy.get('@input').should('not.have.been.called');
    });

    it('sets the range with an end, fires once and closes the lists', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          minute-step="30"
          .value=${morning}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      toggle().click();
      option('start', '13:00:00').click();
      option('end', '17:30:00').click();

      const range = { start: '13:00:00', end: '17:30:00' };
      panel().should('not.exist');
      shown(['13', '00', '17', '30']);
      element().should(([el]) => {
        expect(onInput).to.have.been.calledOnceWith(dispatchedBy(el));
        expect(onChange).to.have.been.calledOnceWith(dispatchedBy(el));
      });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: range });
      cy.focused().should('have.attr', 'data-group', 'start');
    });

    it('changes only the end when an end is picked first', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          minute-step="30"
          .value=${morning}
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      toggle().click();
      option('end', '14:00:00').click();

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: { start: '09:00:00', end: '14:00:00' } });
    });

    it('drops an unfinished pick with Escape and shows the range again, then closes', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          minute-step="30"
          .value=${morning}
        ></gui-range-time-picker>`,
      );

      toggle().click();
      option('start', '13:00:00').click();
      cy.focused().type('{esc}');

      shown(['09', '00', '12', '00']);
      panel().should('exist');
      cy.focused().type('{esc}');
      panel().should('not.exist');
    });

    it('drops an unfinished pick when focus leaves, with no error', () => {
      const onInputError = cy.spy().as('inputError');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-time-picker
            label="Opening hours"
            locale-id="en-US"
            hour-format="24"
            minute-step="30"
            .value=${morning}
            @gui-input-error=${onInputError}
            @gui-blur=${onBlur}
          ></gui-range-time-picker>
          <button id="outside">Outside</button>`,
      );

      toggle().click();
      option('start', '13:00:00').click();
      cy.get('#outside').focus();

      shown(['09', '00', '12', '00']);
      element().should('have.prop', 'value').and('deep.equal', morning);
      cy.get('@inputError').should('not.have.been.called');
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('shows a picked range over a disabled one with its error, and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<form>
          <gui-range-time-picker
            label="Opening hours"
            name="hours"
            locale-id="en-US"
            hour-format="24"
            minute-step="60"
            disabled-range-message="Closed for lunch"
            .disabledRanges=${[{ start: '13:00:00', end: '14:00:00' }]}
            .value=${morning}
            @gui-change=${onChange}
            @gui-input-error=${onInputError}
          ></gui-range-time-picker>
        </form>`,
      );

      toggle().click();
      option('start', '12:00:00').click();
      option('end', '15:00:00').click();

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed for lunch' });
      cy.get('@change').should('not.have.been.called');
      shown(['12', '00', '15', '00']);
      element().should('have.prop', 'value').and('deep.equal', morning);
      element().should(([el]) => expect(el.validationMessage).to.equal('Closed for lunch'));
    });
  });

  describe('keyboard', () => {
    it('steps each time through its list with the arrow keys and commits with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="12:00:00"
          minute-step="30"
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      part('start', 'hour').trigger('keydown', { key: 'ArrowDown' });
      panel().should('exist');
      part('start', 'hour').trigger('keydown', { key: 'ArrowDown' });
      part('start', 'minute').should('have.value', '30');
      part('end', 'hour').trigger('keydown', { key: 'ArrowDown' });
      part('end', 'hour').should('have.value', '10');
      cy.get('@change').should('not.have.been.called');
      part('end', 'hour').trigger('keydown', { key: 'Enter' });

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: { start: '09:30:00', end: '10:00:00' } });
    });
  });

  describe('typing', () => {
    it('sets a typed range when custom times are allowed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          allow-custom-time
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      part('start', 'hour').click();
      cy.focused().type('09');
      cy.focused().type('15');
      part('end', 'hour').click();
      cy.focused().type('11');
      cy.focused().type('45');

      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: { start: '09:15:00', end: '11:45:00' } });
    });

    it('keeps its parts read-only without custom times', () => {
      cy.mount(html`<gui-range-time-picker label="Opening hours"></gui-range-time-picker>`);

      part('start', 'hour').should('have.attr', 'readonly');
    });
  });

  describe('states', () => {
    it('disables its fields and its list toggle', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Opening hours"
          disabled
          .value=${morning}
        ></gui-range-time-picker>`,
      );

      toggle().should('be.disabled');
      cy.get(`${tag} gui-range-time input`).each(($input) => cy.wrap($input).should('be.disabled'));
    });
  });
});
