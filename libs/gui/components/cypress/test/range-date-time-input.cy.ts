import { html } from 'lit';
import { configureMessages, type GuiMessageKey } from '../../src/index';
import type { GuiRangeDateTimeInput } from '../../src/lib/components/range-date-time-input';

type Group = 'start' | 'end';
type Endpoint = [month: string, day: string, year: string, hour: string, minute: string];

const element = () => cy.get<GuiRangeDateTimeInput>('gui-range-date-time');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-date-time [data-group="${group}"][data-type="${type}"]`);
/** Asserts, retrying, what the field's numeric parts show. */
const shown = (values: string[]) =>
  cy
    .get('gui-range-date-time input')
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

describe('gui-range-date-time', () => {
  describe('rendering', () => {
    it('renders both ends in the locale part order, with their names, and no pills', () => {
      cy.mount(
        html`<gui-range-date-time
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          start-date-time-aria-label="Pick-up"
          end-date-time-aria-label="Return"
          .value=${june}
        ></gui-range-date-time>`,
      );

      shown(['06', '10', '2026', '09', '00', '06', '12', '2026', '17', '00']);
      cy.get('gui-range-date-time .gui-range-date-time-input__field')
        .first()
        .should('have.attr', 'aria-label', 'Pick-up');
      cy.get('gui-range-date-time .gui-range-date-time-input__field')
        .last()
        .should('have.attr', 'aria-label', 'Return');
      cy.get('gui-range-date-time gui-pills').should('not.exist');
    });

    it('empties for a value without both ends', () => {
      cy.mount(
        html`<gui-range-date-time
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          .value=${june}
        ></gui-range-date-time>`,
      );

      element().then(([el]) => (el.value = { start: june.start } as never));
      shown(['', '', '', '', '', '', '', '', '', '']);
    });
  });

  describe('value', () => {
    it('sets the range once both ends are typed and fires gui-input and gui-change', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-time>`,
      );

      typeEndpoint('start', ['06', '10', '2026', '09', '00']);
      cy.get('@input').should('not.have.been.called');
      typeEndpoint('end', ['06', '12', '2026', '17', '00']);

      cy.get('@input').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: june });
    });

    it('swaps a reversed pair and shows it in order', () => {
      cy.mount(
        html`<gui-range-date-time
          label="Rental"
          locale-id="en-US"
          hour-format="24"
        ></gui-range-date-time>`,
      );

      typeEndpoint('start', ['06', '12', '2026', '17', '00']);
      typeEndpoint('end', ['06', '10', '2026', '09', '00']);

      element().should('have.prop', 'value').and('deep.equal', june);
      shown(['06', '10', '2026', '09', '00', '06', '12', '2026', '17', '00']);
    });

    it('reports each end as date and time halves for a host', () => {
      const onPartsChange = cy.spy().as('partsChange');
      cy.mount(
        html`<gui-range-date-time
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          @gui-parts-change=${onPartsChange}
        ></gui-range-date-time>`,
      );

      part('start', 'month').click();
      for (const digits of ['06', '10', '2026']) cy.focused().type(digits);
      cy.get('@partsChange')
        .its('lastCall.args.0.detail.start')
        .should('deep.equal', { date: '2026-06-10', time: null });
    });

    it('rejects a range over a disabled span or outside min-date-time, and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-time
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          disabled-range-message="The shop is closed then"
          .disabledRanges=${[{ start: '2026-06-11T12:00:00', end: '2026-06-11T13:00:00' }]}
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-range-date-time>`,
      );

      typeEndpoint('start', ['06', '10', '2026', '09', '00']);
      typeEndpoint('end', ['06', '12', '2026', '17', '00']);

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'The shop is closed then' });
      cy.get('@change').should('not.have.been.called');
      element().should(([el]) => expect(el.value).to.equal(undefined));
    });

    it('rejects a date-time before min-date-time', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-time
          label="Rental"
          locale-id="en-US"
          hour-format="24"
          min-date-time="2026-06-10T10:00:00"
          min-date-time-message="We open at ten"
          @gui-input-error=${onInputError}
        ></gui-range-date-time>`,
      );

      typeEndpoint('start', ['06', '10', '2026', '09', '00']);

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'We open at ten' });
    });

    it('reports a range with one end typed as incomplete when focus leaves, and clears it', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-time
            label="Rental"
            locale-id="en-US"
            hour-format="24"
            incomplete-message="Finish the range"
            .value=${june}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-range-date-time>
          <button id="outside">Outside</button>`,
      );

      part('end', 'minute').click();
      cy.focused().type('{selectall}{backspace}');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
      part('start', 'day').should('have.value', '10');
    });

    it('submits its range as JSON with a form, and reports a half-typed one as bad input', () => {
      cy.mount(
        html`<form>
          <gui-range-date-time
            label="Rental"
            locale-id="en-US"
            hour-format="24"
            name="rental"
          ></gui-range-date-time>
        </form>`,
      );

      typeEndpoint('start', ['06', '10', '2026', '09', '00']);
      element().should(([el]) => expect(el.validity?.badInput).to.equal(true));
      typeEndpoint('end', ['06', '12', '2026', '17', '00']);

      cy.get('form').should(([form]) =>
        expect(new FormData(form as HTMLFormElement).get('rental')).to.equal(JSON.stringify(june)),
      );
    });
  });

  describe('states', () => {
    it('makes its parts read-only, and disables them', () => {
      cy.mount(
        html`<gui-range-date-time label="Rental" readonly .value=${june}></gui-range-date-time>
          <gui-range-date-time
            id="disabled"
            label="Return"
            disabled
            .value=${june}
          ></gui-range-date-time>`,
      );

      cy.get('gui-range-date-time[readonly] input').each(($input) =>
        cy.wrap($input).should('have.attr', 'readonly'),
      );
      cy.get('#disabled input').each(($input) => cy.wrap($input).should('be.disabled'));
    });

    it('takes its end names and its incomplete message from the configured messages', () => {
      const spanish: Partial<Record<GuiMessageKey, string>> = {
        startDateTime: 'Recogida',
        endDateTime: 'Devolución',
        incompleteDateTime: 'Faltan partes',
      };
      configureMessages((key) => spanish[key]);
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-date-time
            label="Alquiler"
            locale-id="es"
            hour-format="24"
            @gui-input-error=${onInputError}
          ></gui-range-date-time>
          <button id="outside">Fuera</button>`,
      );

      cy.get('gui-range-date-time [aria-label="Recogida"]').should('exist');
      cy.get('gui-range-date-time [aria-label="Devolución"]').should('exist');
      part('start', 'day').click();
      cy.focused().type('10');
      cy.get('#outside').focus();
      cy.get('@inputError').its('lastCall.args.0.detail.message').should('equal', 'Faltan partes');
      cy.then(() => configureMessages(null));
    });
  });
});
