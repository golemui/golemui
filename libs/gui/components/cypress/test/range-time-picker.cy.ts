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
const pills = () => cy.get(`${tag} .gui-pills__pill`);

const morning = [{ start: '09:00:00', end: '10:00:00' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-time-picker', () => {
  describe('rendering', () => {
    it('renders its label, its ranges as pills and a collapsed list toggle', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          toggle-aria-label="Open times"
          .value=${morning}
        ></gui-range-time-picker>`,
      );

      cy.get(`${tag} .gui-label`).should('contain.text', 'Shift');
      pills().should('have.length', 1).and('contain.text', '09:00 AM - 10:00 AM');
      toggle()
        .should('have.attr', 'aria-label', 'Open times')
        .and('have.attr', 'aria-expanded', 'false');
      panel().should('not.exist');
      part('start', 'hour').should('have.attr', 'readonly');
    });

    it('opens two lists within its bounds and steps', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="12:00:00"
          minute-step="30"
          start-time-label="Clock in"
          end-time-label="Clock out"
        ></gui-range-time-picker>`,
      );

      toggle().click();

      toggle().should('have.attr', 'aria-expanded', 'true');
      panel().should('contain.text', 'Clock in').and('contain.text', 'Clock out');
      cy.get(`${tag} .gui-range-time-picker__column:first-child .gui-time-list__option`).should(
        'have.length',
        7,
      );
      option('start', '08:30:00').should('not.exist');
      option('start', '12:00:00').should('exist');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when a range is picked from the lists', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          minute-step="30"
          .value=${morning}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      toggle().click();
      option('start', '11:00:00').click();
      part('start', 'hour').should('have.value', '11');
      cy.get('@change').should('not.have.been.called');
      option('end', '12:30:00').click();

      const value = [...morning, { start: '11:00:00', end: '12:30:00' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('have.length', 2);
      element().should(([el]) => expect(el.value).to.deep.equal(value));
    });

    it('fires gui-input-error for a picked range that spans a disabled block', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          minute-step="60"
          disabled-ranges='[{"start":"13:00:00","end":"14:00:00"}]'
          disabled-range-message="Lunch break"
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      toggle().click();
      option('start', '12:00:00').click();
      option('end', '18:00:00').click();

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', {
        message: 'Lunch break',
      });
      cy.get('@change').should('not.have.been.called');
      pills().should('not.exist');
      part('start', 'hour').should('have.value', '12');
    });

    it('keeps focus in its fields without firing gui-blur when a picked range is rejected', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          minute-step="60"
          disabled-ranges='[{"start":"13:00:00","end":"14:00:00"}]'
          .value=${morning}
          @gui-blur=${onBlur}
        ></gui-range-time-picker>`,
      );

      toggle().click();
      option('start', '12:00:00').click();
      option('end', '18:00:00').click();

      panel().should('not.exist');
      cy.focused().should('have.attr', 'data-group', 'start').and('have.attr', 'data-type', 'hour');
      cy.get('@blur').should('not.have.been.called');
    });

    it('fires gui-input-error for a typed time past max-time', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          allow-custom-time
          max-time="12:00:00"
          max-time-message="Too late"
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      part('start', 'hour').click();
      cy.focused().type('09');
      cy.focused().type('00');
      part('end', 'hour').click();
      cy.focused().type('01');
      cy.focused().type('00');
      part('end', 'dayPeriod').click();
      part('end', 'minute').type('{enter}');

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: 'Too late' });
      cy.get('@change').should('not.have.been.called');
    });

    it('fires gui-change without the range whose pill is removed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          .value=${morning}
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      cy.get(`${tag} .gui-pills__pill-remove`).click({ force: true });

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });

    it('fires gui-blur and closes the lists when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-time-picker
            label="Shift"
            locale-id="en-US"
            @gui-blur=${onBlur}
          ></gui-range-time-picker>
          <button>Next</button>`,
      );

      part('start', 'hour').click();
      panel().should('exist');
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@blur').should('have.been.calledOnce');
      panel().should('not.exist');
    });

    it('fires only its own events, which reach an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      const onFocus = cy.spy().as('focus');
      const onPartsChange = cy.spy().as('partsChange');
      const onInputError = cy.spy().as('inputError');
      const onRangeClick = cy.spy().as('rangeClick');
      const onEditStateChange = cy.spy().as('editStateChange');
      cy.mount(
        html`<div
            @gui-blur=${onBlur}
            @gui-focus=${onFocus}
            @gui-parts-change=${onPartsChange}
            @gui-input-error=${onInputError}
            @gui-range-click=${onRangeClick}
            @gui-edit-state-change=${onEditStateChange}
          >
            <gui-range-time-picker
              label="Shift"
              locale-id="en-US"
              minute-step="60"
              allow-edit
              disabled-ranges='[{"start":"13:00:00","end":"14:00:00"}]'
              disabled-range-message="Lunch break"
              .value=${morning}
            ></gui-range-time-picker>
          </div>
          <button id="outside">Outside</button>`,
      );

      // A pill click opens the lists.
      cy.get(`${tag} .gui-pills__pill-text`).click({ force: true });
      option('start', '12:00:00').click();
      option('end', '18:00:00').click();
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
      });
      cy.get('@inputError').should('have.been.calledWithMatch', {
        detail: { message: 'Lunch break' },
      });
      cy.get('@focus').should('not.have.been.called');
      cy.get('@partsChange').should('not.have.been.called');
      cy.get('@rangeClick').should('not.have.been.called');
      cy.get('@editStateChange').should('not.have.been.called');
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          .value=${morning}
        ></gui-range-time-picker>`,
      );

      element().invoke('prop', 'value', [{ start: '14:00:00', end: '16:00:00' }]);

      pills().should('have.length', 1).and('contain.text', '02:00 PM - 04:00 PM');
    });
  });

  describe('keyboard', () => {
    it('steps each endpoint through its list with the arrow keys and commits with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
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
        .should('deep.equal', { value: [{ start: '09:30:00', end: '10:00:00' }] });
    });

    it('closes the lists with Escape', () => {
      cy.mount(
        html`<gui-range-time-picker label="Shift" locale-id="en-US"></gui-range-time-picker>`,
      );

      toggle().click();
      cy.focused().should('have.class', 'gui-time-list__option').type('{esc}');

      panel().should('not.exist');
      toggle().should('have.attr', 'aria-expanded', 'false');
    });
  });

  describe('states', () => {
    it('locks its pills and lists while read-only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          readonly
          minute-step="60"
          .value=${morning}
          @gui-change=${onChange}
        ></gui-range-time-picker>`,
      );

      pills().should('be.disabled');
      toggle().click();
      option('start', '11:00:00').click({ force: true });
      option('end', '12:00:00').click({ force: true });

      cy.get('@change').should('not.have.been.called');
      pills().should('have.length', 1);
    });

    it('disables its fields and its list toggle', () => {
      cy.mount(
        html`<gui-range-time-picker
          label="Shift"
          locale-id="en-US"
          disabled
          .value=${morning}
        ></gui-range-time-picker>`,
      );

      part('start', 'hour').should('be.disabled');
      toggle().should('be.disabled');
      cy.get(`${tag} .gui-widget`).first().click({ force: true });
      panel().should('not.exist');
    });
  });
});
