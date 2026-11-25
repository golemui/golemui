import { html } from 'lit';
import { configureMessages, type GuiMessageKey } from '../../src/index';
import type { GuiRangeTimeInput } from '../../src/lib/components/range-time-input';

type Group = 'start' | 'end';

const element = () => cy.get<GuiRangeTimeInput>('gui-range-time');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-time input[data-group="${group}"][data-type="${type}"]`);
/** Asserts, retrying, what the field's hour and minute parts show. */
const shown = (values: string[]) =>
  cy
    .get('gui-range-time input[data-type="hour"], gui-range-time input[data-type="minute"]')
    .should(($inputs) =>
      expect($inputs.toArray().map((input) => (input as HTMLInputElement).value)).to.deep.equal(
        values,
      ),
    );

const typeTime = (group: Group, hour: string, minute: string) => {
  part(group, 'hour').click();
  cy.focused().type(hour);
  cy.focused().type(minute);
};

const morning = { start: '09:00:00', end: '12:30:00' };

describe('gui-range-time', () => {
  describe('rendering', () => {
    it('renders its value as two times, and no pills', () => {
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          .value=${morning}
        ></gui-range-time>`,
      );

      shown(['09', '00', '12', '30']);
      cy.get(
        'gui-range-time .gui-range-time-input__inputs > .gui-range-time-input__separator',
      ).should('have.text', '-');
      cy.get('gui-range-time gui-pills').should('not.exist');
    });

    it('shows its times on a 12-hour clock with their AM/PM part', () => {
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="12"
          .value=${{ start: '09:00:00', end: '17:30:00' }}
        ></gui-range-time>`,
      );

      shown(['09', '00', '05', '30']);
      cy.get('gui-range-time [data-group="end"][data-type="dayPeriod"]').should(
        'contain.text',
        'PM',
      );
    });

    it('names the field with its label and each time with its aria-label attribute', () => {
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          start-time-aria-label="Opens"
          end-time-aria-label="Closes"
        ></gui-range-time>`,
      );

      cy.get('gui-range-time .gui-range-time-input')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Opening hours'));
      cy.get('gui-range-time .gui-range-time-input__field')
        .first()
        .should('have.attr', 'aria-label', 'Opens');
      cy.get('gui-range-time .gui-range-time-input__field')
        .last()
        .should('have.attr', 'aria-label', 'Closes');
    });

    it('shows a value set from outside, and empties for a value without both ends', () => {
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
        ></gui-range-time>`,
      );

      element().then(([el]) => (el.value = morning));
      shown(['09', '00', '12', '30']);
      element().then(([el]) => (el.value = { start: '09:00:00' } as never));
      shown(['', '', '', '']);
    });
  });

  describe('value', () => {
    it('sets the range once both times are typed and fires gui-input and gui-change', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-time>`,
      );

      typeTime('start', '09', '00');
      cy.get('@input').should('not.have.been.called');
      typeTime('end', '12', '30');

      cy.get('@input').should('have.been.calledOnce');
      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: morning });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: morning });
    });

    it('rejects an end that is not after the start, without swapping, and keeps the value', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          range-order-message="Closes before it opens"
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-range-time>`,
      );

      typeTime('start', '12', '30');
      typeTime('end', '09', '00');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closes before it opens' });
      cy.get('@change').should('not.have.been.called');
      shown(['12', '30', '09', '00']);
      element().should(([el]) => expect(el.value).to.equal(undefined));
    });

    it('rejects equal times', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          @gui-input-error=${onInputError}
        ></gui-range-time>`,
      );

      typeTime('start', '09', '00');
      typeTime('end', '09', '00');

      cy.get('@inputError').should('have.been.called');
    });

    it('rejects a time outside min-time and max-time', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          min-time="08:00:00"
          max-time="20:00:00"
          min-time-message="We open at eight"
          @gui-input-error=${onInputError}
        ></gui-range-time>`,
      );

      typeTime('start', '07', '00');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'We open at eight' });
    });

    it('rejects a range over a disabled one, and keeps the value', () => {
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-time
          label="Opening hours"
          locale-id="en-US"
          hour-format="24"
          disabled-range-message="Closed for lunch"
          .disabledRanges=${[{ start: '13:00:00', end: '14:00:00' }]}
          @gui-input-error=${onInputError}
        ></gui-range-time>`,
      );

      typeTime('start', '12', '00');
      typeTime('end', '15', '00');

      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed for lunch' });
      element().should(([el]) => expect(el.value).to.equal(undefined));
    });

    it('reports a range with one time typed as incomplete when focus leaves, and clears it', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-time
            label="Opening hours"
            locale-id="en-US"
            hour-format="24"
            incomplete-message="Finish the range"
            .value=${morning}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-range-time>
          <button id="outside">Outside</button>`,
      );

      part('end', 'minute').click();
      cy.focused().type('{selectall}{backspace}');
      part('end', 'hour').click();
      cy.focused().type('{selectall}{backspace}');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
      part('start', 'hour').should('have.value', '09');
    });

    it('clears the value when both times are emptied, with no error', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-time
            label="Opening hours"
            locale-id="en-US"
            hour-format="24"
            .value=${morning}
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-range-time>
          <button id="outside">Outside</button>`,
      );

      cy.get('gui-range-time input').each(($input) => {
        cy.wrap($input).click();
        cy.focused().type('{selectall}{backspace}');
      });
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError').should('not.have.been.called');
    });

    it('submits its range as JSON with a form, and reports a half-typed one as bad input', () => {
      cy.mount(
        html`<form>
          <gui-range-time
            label="Opening hours"
            locale-id="en-US"
            hour-format="24"
            name="hours"
          ></gui-range-time>
        </form>`,
      );

      typeTime('start', '09', '00');
      element().should(([el]) => expect(el.validity?.badInput).to.equal(true));
      typeTime('end', '12', '30');

      cy.get('form').should(([form]) =>
        expect(new FormData(form as HTMLFormElement).get('hours')).to.equal(
          JSON.stringify(morning),
        ),
      );
      element().should(([el]) => expect(el.validity?.valid).to.equal(true));
    });
  });

  describe('states', () => {
    it('makes its parts read-only, and disables them', () => {
      cy.mount(
        html`<gui-range-time label="Opening hours" readonly .value=${morning}></gui-range-time>
          <gui-range-time
            id="disabled"
            label="Closing hours"
            disabled
            .value=${morning}
          ></gui-range-time>`,
      );

      cy.get('gui-range-time[readonly] input').each(($input) =>
        cy.wrap($input).should('have.attr', 'readonly'),
      );
      cy.get('#disabled input').each(($input) => cy.wrap($input).should('be.disabled'));
    });

    it('keeps the start time first in a right-to-left context', () => {
      cy.mount(
        html`<div dir="rtl">
          <gui-range-time label="Opening hours" .value=${morning}></gui-range-time>
        </div>`,
      );

      cy.get('gui-range-time .gui-range-time-input__field').then(([start, end]) => {
        expect(start.getBoundingClientRect().left).to.be.greaterThan(
          end.getBoundingClientRect().left,
        );
      });
    });

    it('takes its time names and its order message from the configured messages', () => {
      const spanish: Partial<Record<GuiMessageKey, string>> = {
        startTime: 'Hora de inicio',
        endTime: 'Hora de fin',
        timeRangeOrder: 'La hora de fin va después de la de inicio',
      };
      configureMessages((key) => spanish[key]);
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-range-time
          label="Horario"
          locale-id="es"
          hour-format="24"
          @gui-input-error=${onInputError}
        ></gui-range-time>`,
      );

      cy.get('gui-range-time [aria-label="Hora de inicio"]').should('exist');
      cy.get('gui-range-time [aria-label="Hora de fin"]').should('exist');
      typeTime('start', '12', '00');
      typeTime('end', '09', '00');
      cy.get('@inputError')
        .its('lastCall.args.0.detail.message')
        .should('equal', 'La hora de fin va después de la de inicio');
      cy.then(() => configureMessages(null));
    });
  });
});
