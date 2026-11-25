import { html } from 'lit';
import { configureMessages, type GuiMessageKey } from '../../src/index';
import type { GuiRangeDateInput } from '../../src/lib/components/range-date-input';

type Group = 'start' | 'end';

const element = () => cy.get<GuiRangeDateInput>('gui-range-date');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-date input[data-group="${group}"][data-type="${type}"]`);
/** Asserts, retrying, what the field's parts show. */
const shown = (values: string[]) =>
  cy
    .get('gui-range-date input')
    .should(($inputs) =>
      expect($inputs.toArray().map((input) => (input as HTMLInputElement).value)).to.deep.equal(
        values,
      ),
    );

const typeDate = (group: Group, month: string, day: string, year: string) => {
  part(group, 'month').click();
  cy.focused().type(month);
  cy.focused().type(day);
  cy.focused().type(year);
};

const march = { start: '2026-03-02', end: '2026-03-06' };

describe('gui-range-date', () => {
  describe('rendering', () => {
    it('renders its value as two dates, each in the locale order, and no pills', () => {
      cy.mount(
        html`<gui-range-date label="Trip" locale-id="en-US" .value=${march}></gui-range-date>`,
      );

      shown(['03', '02', '2026', '03', '06', '2026']);
      cy.get(
        'gui-range-date .gui-range-date-input__inputs > .gui-range-date-input__separator',
      ).should('have.text', '-');
      cy.get('gui-range-date gui-pills').should('not.exist');
    });

    it('names the field with its label and each date with its aria-label attribute', () => {
      cy.mount(
        html`<gui-range-date
          label="Trip"
          locale-id="en-US"
          start-date-aria-label="Departure"
          end-date-aria-label="Return"
          separator="to"
        ></gui-range-date>`,
      );

      cy.get('gui-range-date .gui-range-date-input')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Trip'));
      cy.get('gui-range-date .gui-range-date-input__field')
        .first()
        .should('have.attr', 'aria-label', 'Departure');
      cy.get('gui-range-date .gui-range-date-input__field')
        .last()
        .should('have.attr', 'aria-label', 'Return');
      cy.get(
        'gui-range-date .gui-range-date-input__inputs > .gui-range-date-input__separator',
      ).should('have.text', 'to');
    });

    it('shows a value set from outside, and empties for a value without both ends', () => {
      cy.mount(html`<gui-range-date label="Trip" locale-id="en-US"></gui-range-date>`);

      element().then(([el]) => (el.value = march));
      shown(['03', '02', '2026', '03', '06', '2026']);

      element().then(([el]) => (el.value = undefined));
      shown(['', '', '', '', '', '']);
    });
  });

  describe('value', () => {
    it('sets the range once both dates are typed and fires gui-input and gui-change', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date
          label="Trip"
          locale-id="en-US"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date>`,
      );

      typeDate('start', '03', '16', '2026');
      cy.get('@input').should('not.have.been.called');
      typeDate('end', '03', '19', '2026');

      const range = { start: '2026-03-16', end: '2026-03-19' };
      cy.get('@input').should('have.been.calledOnce');
      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: range });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: range });
      element().should('have.prop', 'value').and('deep.equal', range);
    });

    it('swaps a reversed pair and shows it in order', () => {
      cy.mount(html`<gui-range-date label="Trip" locale-id="en-US"></gui-range-date>`);

      typeDate('start', '03', '19', '2026');
      typeDate('end', '03', '16', '2026');

      element()
        .should('have.prop', 'value')
        .and('deep.equal', { start: '2026-03-16', end: '2026-03-19' });
      shown(['03', '16', '2026', '03', '19', '2026']);
    });

    it('fires gui-parts-change with each typed date', () => {
      const onPartsChange = cy.spy().as('partsChange');
      cy.mount(
        html`<gui-range-date
          label="Trip"
          locale-id="en-US"
          @gui-parts-change=${onPartsChange}
        ></gui-range-date>`,
      );

      typeDate('start', '03', '16', '2026');

      cy.get('@partsChange')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { start: '2026-03-16', end: null });
    });

    it('fires gui-input-error for an impossible date and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date
          label="Trip"
          locale-id="en-US"
          invalid-date-message="No such day"
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-range-date>`,
      );

      typeDate('start', '03', '16', '2026');
      typeDate('end', '02', '31', '2026');

      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'No such day' });
      cy.get('@change').should('not.have.been.called');
    });

    it('reports a range with one date typed as incomplete when focus leaves, and clears it', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date
            label="Trip"
            locale-id="en-US"
            incomplete-message="Finish the range"
            .value=${march}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-range-date>
          <button id="outside">Outside</button>`,
      );

      part('end', 'year').click();
      cy.focused().type('{selectall}{backspace}');
      part('end', 'month').click();
      cy.focused().type('{selectall}{backspace}');
      part('end', 'day').click();
      cy.focused().type('{selectall}{backspace}');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
      part('start', 'day').should('have.value', '02');
    });

    it('clears the value when both dates are emptied, with no error', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date
            label="Trip"
            locale-id="en-US"
            .value=${march}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-range-date>
          <button id="outside">Outside</button>`,
      );

      cy.get('gui-range-date input').each(($input) => {
        cy.wrap($input).click();
        cy.focused().type('{selectall}{backspace}');
      });
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError').should('not.have.been.called');
      element().should(([el]) => expect(el.value).to.equal(undefined));
    });

    it('submits its range as JSON with a form, and reports a half-typed one as bad input', () => {
      cy.mount(
        html`<form>
          <gui-range-date label="Trip" locale-id="en-US" name="trip"></gui-range-date>
        </form>`,
      );

      typeDate('start', '03', '16', '2026');
      element().should(([el]) => expect(el.validity?.badInput).to.equal(true));
      typeDate('end', '03', '19', '2026');

      cy.get('form').should(([form]) =>
        expect(new FormData(form as HTMLFormElement).get('trip')).to.equal(
          JSON.stringify({ start: '2026-03-16', end: '2026-03-19' }),
        ),
      );
      element().should(([el]) => expect(el.validity?.valid).to.equal(true));
    });
  });

  describe('keyboard', () => {
    it('moves from the start date to the end date as the parts fill', () => {
      cy.mount(html`<gui-range-date label="Trip" locale-id="en-US"></gui-range-date>`);

      typeDate('start', '03', '16', '2026');

      cy.focused().should('have.attr', 'data-group', 'end').and('have.attr', 'data-type', 'month');
    });
  });

  describe('states', () => {
    it('makes its parts read-only, and disables them', () => {
      cy.mount(
        html`<gui-range-date
            label="Trip"
            locale-id="en-US"
            readonly
            .value=${march}
          ></gui-range-date>
          <gui-range-date
            id="disabled"
            label="Return"
            locale-id="en-US"
            disabled
            .value=${march}
          ></gui-range-date>`,
      );

      cy.get('gui-range-date[readonly] input').each(($input) =>
        cy.wrap($input).should('have.attr', 'readonly'),
      );
      cy.get('#disabled input').each(($input) => cy.wrap($input).should('be.disabled'));
    });

    it('keeps the start date first in a right-to-left context', () => {
      cy.mount(
        html`<div dir="rtl">
          <gui-range-date label="Trip" locale-id="en-US" .value=${march}></gui-range-date>
        </div>`,
      );

      cy.get('gui-range-date .gui-range-date-input__field').then(([start, end]) => {
        expect(start.getBoundingClientRect().left).to.be.greaterThan(
          end.getBoundingClientRect().left,
        );
      });
    });

    it('takes its date names and its incomplete message from the configured messages', () => {
      const spanish: Partial<Record<GuiMessageKey, string>> = {
        startDate: 'Fecha de inicio',
        endDate: 'Fecha de fin',
        incompleteDate: 'Fecha incompleta',
      };
      configureMessages((key) => spanish[key]);
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date
            label="Viaje"
            locale-id="es"
            @gui-input-error=${onInputError}
          ></gui-range-date>
          <button id="outside">Fuera</button>`,
      );

      cy.get('gui-range-date [aria-label="Fecha de inicio"]').should('exist');
      cy.get('gui-range-date [aria-label="Fecha de fin"]').should('exist');
      part('start', 'day').click();
      cy.focused().type('16');
      cy.get('#outside').focus();
      cy.get('@inputError')
        .its('lastCall.args.0.detail.message')
        .should('equal', 'Fecha incompleta');
      cy.then(() => configureMessages(null));
    });
  });
});
