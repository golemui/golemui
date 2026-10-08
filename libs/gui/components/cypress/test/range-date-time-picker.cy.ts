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
const pills = () => cy.get(`${tag} .gui-pills__pill`);
const timePicker = (group: Group) =>
  cy.get(`${tag} gui-time-picker.gui-range-date-time-calendar__${group}`);
const pickTime = (group: Group, time: string) => {
  timePicker(group).find('gui-time input[data-type="hour"]').click();
  timePicker(group).find(`.gui-time-list__option[data-value="${time}"]`).click();
};
const typeEndpoint = (group: Group, [month, day, year, hour, minute]: Endpoint) => {
  part(group, 'month').click();
  for (const digits of [month, day, year, hour, minute]) cy.focused().type(digits);
};

const june = [{ start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-date-time-picker', () => {
  describe('rendering', () => {
    it('renders its label, its ranges as pills and a collapsed calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          toggle-aria-label="Open calendar"
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      cy.get(`${tag} .gui-label`).should('contain.text', 'Shift');
      pills().should('have.length', 1).and('contain.text', '06/10/2026');
      toggle()
        .should('have.attr', 'aria-label', 'Open calendar')
        .and('have.attr', 'aria-expanded', 'false');
      calendar().should('not.exist');
    });

    it('opens a calendar at the month of its first range with its bounds and time labels', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          number-of-months="2"
          start-time-label="Clock in"
          end-time-label="Clock out"
          min-date-time="2026-06-05T08:00:00"
          max-date-time="2026-07-20T18:00:00"
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      toggle().click();

      toggle().should('have.attr', 'aria-expanded', 'true');
      calendar().find('.gui-calendar__panel').should('have.length', 2);
      timePicker('start').should('contain.text', 'Clock in');
      timePicker('end').should('contain.text', 'Clock out');
      day('2026-06-10').should('have.class', 'range-start');
      day('2026-06-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-07-21').should('have.attr', 'aria-disabled', 'true');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when days and times are picked in the calendar', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          .value=${june}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      toggle().click();
      day('2026-06-20').click();
      part('start', 'day').should('have.value', '20');
      day('2026-06-21').click();
      pickTime('start', '09:00:00');
      part('start', 'hour').should('have.value', '09');
      cy.get('@change').should('not.have.been.called');
      pickTime('end', '11:00:00');

      const value = [...june, { start: '2026-06-20T09:00:00', end: '2026-06-21T11:00:00' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('have.length', 2);
    });

    it('fires gui-change when a typed range is committed with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      typeEndpoint('start', ['06', '15', '2026', '09', '00']);
      typeEndpoint('end', ['06', '15', '2026', '11', '30']);
      part('end', 'minute').type('{enter}');

      const value = [{ start: '2026-06-15T09:00:00', end: '2026-06-15T11:30:00' }];
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      element().should(([el]) => expect(el.value).to.deep.equal(value));
    });

    it('fires gui-input-error for a typed date-time past max-date-time', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          max-date-time="2026-06-15T12:00:00"
          max-date-time-message="Too late"
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      typeEndpoint('start', ['06', '15', '2026', '09', '00']);
      typeEndpoint('end', ['06', '16', '2026', '09', '00']);
      part('end', 'minute').type('{enter}');

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: 'Too late' });
      cy.get('@change').should('not.have.been.called');
      pills().should('not.exist');
    });

    it('fires gui-input-error for a picked range that steps over a disabled day', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          disabled-ranges='[{"start":"2026-06-17T00:00:00","end":"2026-06-17T23:59:59"}]'
          disabled-range-message="Closed that day"
          .value=${june}
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      toggle().click();
      day('2026-06-15').click();
      day('2026-06-20').click();

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Closed that day' });
      cy.get('@change').should('not.have.been.called');
    });

    it('fires gui-change without the range whose pill is removed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      cy.get(`${tag} .gui-pills__pill-remove`).click({ force: true });

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });

    it('fires gui-blur and closes the calendar when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-date-time-picker
            label="Shift"
            locale-id="en-US"
            .value=${june}
            @gui-blur=${onBlur}
          ></gui-range-date-time-picker>
          <button>Next</button>`,
      );

      part('start', 'month').click();
      calendar().should('exist');
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@blur').should('have.been.calledOnce');
      calendar().should('not.exist');
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
            <gui-range-date-time-picker
              label="Shift"
              locale-id="en-US"
              allow-edit
              disabled-ranges='[{"start":"2026-06-17T00:00:00","end":"2026-06-17T23:59:59"}]'
              disabled-range-message="Closed that day"
              .value=${june}
            ></gui-range-date-time-picker>
          </div>
          <button id="outside">Outside</button>`,
      );

      cy.get(`${tag} .gui-pills__pill-text`).click({ force: true });
      part('start', 'month').focus();
      day('2026-06-15').click();
      day('2026-06-20').click();
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
      });
      cy.get('@inputError').should('have.been.calledWithMatch', {
        detail: { message: 'Closed that day' },
      });
      cy.get('@focus').should('not.have.been.called');
      cy.get('@partsChange').should('not.have.been.called');
      cy.get('@rangeClick').should('not.have.been.called');
      cy.get('@editStateChange').should('not.have.been.called');
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      element().invoke('prop', 'value', [
        { start: '2026-09-01T08:00:00', end: '2026-09-03T10:00:00' },
      ]);

      pills().should('have.length', 1).and('contain.text', '09/01/2026');
    });
  });

  describe('keyboard', () => {
    it('closes the calendar with Escape and returns focus to the fields', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      toggle().click();
      day('2026-06-18').focus().type('{esc}');

      calendar().should('not.exist');
      cy.focused().should('have.attr', 'data-group', 'start');
    });
  });

  describe('states', () => {
    it('ignores picks and locks its fields while read-only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          readonly
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-time-picker>`,
      );

      part('start', 'month').should('have.attr', 'readonly');
      toggle().click();
      day('2026-06-18').click();
      day('2026-06-20').click();

      day('2026-06-18').should('not.have.class', 'is-anchor');
      cy.get('@change').should('not.have.been.called');
      pills().should('have.length', 1).and('be.disabled');
    });

    it('disables its fields and its calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-time-picker
          label="Shift"
          locale-id="en-US"
          disabled
          .value=${june}
        ></gui-range-date-time-picker>`,
      );

      part('start', 'month').should('be.disabled');
      toggle().should('be.disabled');
      cy.get(`${tag} .gui-widget`).first().click({ force: true });
      calendar().should('not.exist');
    });
  });
});
