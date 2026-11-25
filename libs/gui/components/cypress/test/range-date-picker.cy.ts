import { html } from 'lit';
import type { GuiRangeDatePicker } from '../../src/lib/components/range-date-picker';

type Group = 'start' | 'end';

const element = () => cy.get<GuiRangeDatePicker>('gui-range-date-picker');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-date-picker input[data-group="${group}"][data-type="${type}"]`);
/** Asserts, retrying, what the field's parts show. */
const shown = (values: string[]) =>
  cy
    .get('gui-range-date-picker gui-range-date input')
    .should(($inputs) =>
      expect($inputs.toArray().map((input) => (input as HTMLInputElement).value)).to.deep.equal(
        values,
      ),
    );
const toggle = () => cy.get('gui-range-date-picker button[aria-haspopup="dialog"]');
const calendar = () => cy.get('gui-range-date-picker gui-range-calendar');
const day = (date: string) => cy.get(`gui-range-date-picker [data-date="${date}"]`);

const typeDate = (group: Group, month: string, day: string, year: string) => {
  part(group, 'month').click();
  cy.focused().type(month);
  cy.focused().type(day);
  cy.focused().type(year);
};

const march = { start: '2026-03-02', end: '2026-03-06' };
const disabled = [{ start: '2026-03-09', end: '2026-03-11' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-date-picker', () => {
  describe('rendering', () => {
    it('renders its label, its range in the field and a collapsed calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          toggle-aria-label="Open calendar"
          .value=${march}
        ></gui-range-date-picker>`,
      );

      cy.get('gui-range-date-picker .gui-label').should('contain.text', 'Trip');
      shown(['03', '02', '2026', '03', '06', '2026']);
      toggle()
        .should('have.attr', 'aria-label', 'Open calendar')
        .and('have.attr', 'aria-expanded', 'false');
      calendar().should('not.exist');
    });

    it('opens a calendar at the month of its range, with its bounds', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          min-date="2026-03-02"
          .disabledRanges=${disabled}
          .value=${march}
        ></gui-range-date-picker>`,
      );

      toggle().click();

      toggle().should('have.attr', 'aria-expanded', 'true');
      day('2026-03-02').should('have.class', 'range-start');
      day('2026-03-06').should('have.class', 'range-end');
      day('2026-03-01').should('have.attr', 'aria-disabled', 'true');
      day('2026-03-10').should('have.attr', 'aria-disabled', 'true');
    });
  });

  describe('picking', () => {
    it('shows the first picked day as the start, with the end empty, and fires nothing', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          .value=${march}
          @gui-input=${onInput}
        ></gui-range-date-picker>`,
      );

      toggle().click();
      day('2026-03-16').click();

      shown(['03', '16', '2026', '', '', '']);
      day('2026-03-02').should('not.have.class', 'range-start');
      calendar().should('exist');
      cy.get('@input').should('not.have.been.called');
    });

    it('sets the range on the second click, fires once and closes the calendar', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          .value=${march}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      toggle().click();
      day('2026-03-16').click();
      day('2026-03-19').click();

      const range = { start: '2026-03-16', end: '2026-03-19' };
      calendar().should('not.exist');
      toggle().should('have.attr', 'aria-expanded', 'false');
      shown(['03', '16', '2026', '03', '19', '2026']);
      element().should(([el]) => {
        expect(onInput).to.have.been.calledOnceWith(dispatchedBy(el));
        expect(onChange).to.have.been.calledOnceWith(dispatchedBy(el));
      });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: range });
      cy.focused().should('have.attr', 'data-group', 'start');
    });

    it('drops an unfinished pick with Escape and shows the range again, then closes', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          .value=${march}
        ></gui-range-date-picker>`,
      );

      toggle().click();
      day('2026-03-16').click();
      cy.focused().type('{esc}');

      shown(['03', '02', '2026', '03', '06', '2026']);
      calendar().should('exist');
      day('2026-03-02').should('have.class', 'range-start');

      cy.focused().type('{esc}');
      calendar().should('not.exist');
    });

    it('keeps an unfinished pick while focus moves to the field, and drops it when focus leaves', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-picker
            label="Trip"
            locale-id="en-US"
            .value=${march}
            @gui-input-error=${onInputError}
          ></gui-range-date-picker>
          <button id="outside">Outside</button>`,
      );

      toggle().click();
      day('2026-03-16').click();
      part('end', 'month').focus();
      shown(['03', '16', '2026', '', '', '']);

      cy.get('#outside').focus();
      shown(['03', '02', '2026', '03', '06', '2026']);
      element().should('have.prop', 'value').and('deep.equal', march);
      cy.get('@inputError').should('not.have.been.called');
    });

    it('shows a picked range over a disabled day with its error, and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<form>
          <gui-range-date-picker
            label="Trip"
            locale-id="en-US"
            name="trip"
            disabled-date-range-message="Closed those days"
            .disabledRanges=${disabled}
            .value=${march}
            @gui-change=${onChange}
            @gui-input-error=${onInputError}
          ></gui-range-date-picker>
        </form>`,
      );

      toggle().click();
      day('2026-03-05').click();
      day('2026-03-12').click();

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed those days' });
      cy.get('@change').should('not.have.been.called');
      shown(['03', '05', '2026', '03', '12', '2026']);
      day('2026-03-12').should('have.class', 'invalid-range-end');
      element().should('have.prop', 'value').and('deep.equal', march);
      element().should(([el]) => expect(el.validationMessage).to.equal('Closed those days'));

      day('2026-03-16').click();
      day('2026-03-19').click();
      element().should(([el]) => expect(el.validity?.valid).to.equal(true));
    });
  });

  describe('typing', () => {
    it('sets a typed range, which the open calendar follows', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      typeDate('start', '03', '16', '2026');
      calendar().should('exist');
      day('2026-03-16').should('have.class', 'is-anchor');
      typeDate('end', '03', '19', '2026');

      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: { start: '2026-03-16', end: '2026-03-19' } });
      day('2026-03-17').should('have.class', 'in-range');
    });

    it('shows a typed range over a disabled day with its error, and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          disabled-date-range-message="Closed those days"
          .disabledRanges=${disabled}
          .value=${march}
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-range-date-picker>`,
      );

      part('end', 'day').click();
      cy.focused().type('{selectall}12');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed those days' });
      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value').and('deep.equal', march);
    });

    it('reports a half-typed range as incomplete when focus leaves, and clears the value', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-date-picker
            label="Trip"
            locale-id="en-US"
            incomplete-message="Finish the range"
            .value=${march}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
            @gui-blur=${onBlur}
          ></gui-range-date-picker>
          <button id="outside">Outside</button>`,
      );

      part('end', 'year').click();
      cy.focused().type('{selectall}{backspace}');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('clears the value when both dates are emptied and focus leaves', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
            label="Trip"
            locale-id="en-US"
            .value=${march}
            @gui-change=${onChange}
          ></gui-range-date-picker>
          <button id="outside">Outside</button>`,
      );

      cy.get('gui-range-date-picker gui-range-date input').each(($input) => {
        cy.wrap($input).click();
        cy.focused().type('{selectall}{backspace}');
      });
      cy.get('#outside').focus();

      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      element().should(([el]) => expect(el.value).to.equal(undefined));
    });
  });

  describe('states', () => {
    it('ignores picks and locks its fields while read-only', () => {
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          readonly
          .value=${march}
          @gui-input=${onInput}
        ></gui-range-date-picker>`,
      );

      toggle().click();
      day('2026-03-16').click();
      day('2026-03-19').click();

      cy.get('@input').should('not.have.been.called');
      cy.get('gui-range-date-picker gui-range-date input').each(($input) =>
        cy.wrap($input).should('have.attr', 'readonly'),
      );
    });

    it('disables its fields and its calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Trip"
          locale-id="en-US"
          disabled
          .value=${march}
        ></gui-range-date-picker>`,
      );

      toggle().should('be.disabled');
      cy.get('gui-range-date-picker gui-range-date input').each(($input) =>
        cy.wrap($input).should('be.disabled'),
      );
    });
  });
});
