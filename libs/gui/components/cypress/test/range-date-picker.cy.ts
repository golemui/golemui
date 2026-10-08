import { html } from 'lit';
import type { GuiRangeDatePicker } from '../../src/lib/components/range-date-picker';

type Group = 'start' | 'end';

const element = () => cy.get<GuiRangeDatePicker>('gui-range-date-picker');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-date-picker input[data-group="${group}"][data-type="${type}"]`);
const toggle = () => cy.get('gui-range-date-picker button[aria-haspopup="dialog"]');
const calendar = () => cy.get('gui-range-date-picker gui-range-calendar');
const day = (date: string) => cy.get(`gui-range-date-picker [data-date="${date}"]`);
const pills = () => cy.get('gui-range-date-picker .gui-pills__pill');

const typeDate = (group: Group, month: string, day: string, year: string) => {
  part(group, 'month').click();
  cy.focused().type(month);
  cy.focused().type(day);
  cy.focused().type(year);
};

const june = [{ start: '2026-06-10', end: '2026-06-12' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-date-picker', () => {
  describe('rendering', () => {
    it('renders its label, its ranges as pills and a collapsed calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          toggle-aria-label="Open calendar"
          .value=${june}
        ></gui-range-date-picker>`,
      );

      cy.get('gui-range-date-picker .gui-label').should('contain.text', 'Stay');
      pills().should('have.length', 1).and('contain.text', '06/10/2026 - 06/12/2026');
      toggle()
        .should('have.attr', 'aria-label', 'Open calendar')
        .and('have.attr', 'aria-expanded', 'false');
      calendar().should('not.exist');
    });

    it('opens a calendar at the month of its first range with its bounds', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          number-of-months="2"
          min-date="2026-06-05"
          max-date="2026-07-20"
          .value=${june}
        ></gui-range-date-picker>`,
      );

      toggle().click();

      toggle().should('have.attr', 'aria-expanded', 'true');
      calendar().find('.gui-calendar__panel').should('have.length', 2);
      day('2026-06-10').should('have.class', 'range-start');
      day('2026-06-04').should('have.attr', 'aria-disabled', 'true');
      day('2026-07-21').should('have.attr', 'aria-disabled', 'true');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when a range is picked in the calendar', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          .value=${june}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      toggle().click();
      day('2026-06-18').click();
      part('start', 'day').should('have.value', '18');
      cy.get('@change').should('not.have.been.called');
      day('2026-06-20').click();

      const value = [...june, { start: '2026-06-18', end: '2026-06-20' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('have.length', 2);
      calendar().should('exist');
    });

    it('fires gui-change when a typed range is committed with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      typeDate('start', '06', '15', '2026');
      typeDate('end', '06', '18', '2026');
      cy.focused().type('{enter}');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: [{ start: '2026-06-15', end: '2026-06-18' }] });
      element().should(([el]) =>
        expect(el.value).to.deep.equal([{ start: '2026-06-15', end: '2026-06-18' }]),
      );
    });

    it('fires gui-input-error for a typed range past max-date', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          max-date="2026-06-20"
          max-date-message="Too late"
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      typeDate('start', '06', '25', '2026');
      typeDate('end', '06', '26', '2026');
      cy.focused().type('{enter}');

      cy.get('@error').its('lastCall.args.0.detail.message').should('equal', 'Too late');
      cy.get('@change').should('not.have.been.called');
      pills().should('not.exist');
      part('start', 'day').should('have.value', '25');
    });

    it('fires gui-input-error for a picked range that spans a disabled date', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          disabled-ranges='[{"start":"2026-06-17","end":"2026-06-18"}]'
          disabled-date-range-message="Closed that week"
          .value=${june}
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      toggle().click();
      day('2026-06-15').click();
      day('2026-06-20').click();

      cy.get('@error').its('lastCall.args.0.detail.message').should('equal', 'Closed that week');
      cy.get('@change').should('not.have.been.called');
      pills().should('have.length', 1);
    });

    it('fires gui-change without the range whose pill is removed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      cy.get('gui-range-date-picker .gui-pills__pill-remove').click({ force: true });

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });

    it('fires gui-blur and closes the calendar when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-date-picker
            label="Stay"
            locale-id="en-US"
            .value=${june}
            @gui-blur=${onBlur}
          ></gui-range-date-picker>
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
            <gui-range-date-picker
              label="Stay"
              locale-id="en-US"
              allow-edit
              disabled-ranges='[{"start":"2026-06-17","end":"2026-06-18"}]'
              disabled-date-range-message="Closed that week"
              .value=${june}
            ></gui-range-date-picker>
          </div>
          <button id="outside">Outside</button>`,
      );

      cy.get('gui-range-date-picker .gui-pills__pill-text').click({ force: true });
      part('start', 'month').focus();
      day('2026-06-15').click();
      day('2026-06-20').click();
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
      });
      cy.get('@inputError').should('have.been.calledWithMatch', {
        detail: { message: 'Closed that week' },
      });
      cy.get('@focus').should('not.have.been.called');
      cy.get('@partsChange').should('not.have.been.called');
      cy.get('@rangeClick').should('not.have.been.called');
      cy.get('@editStateChange').should('not.have.been.called');
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          .value=${june}
        ></gui-range-date-picker>`,
      );

      element().invoke('prop', 'value', [{ start: '2026-09-01', end: '2026-09-03' }]);

      pills().should('have.length', 1).and('contain.text', '09/01/2026 - 09/03/2026');
    });
  });

  describe('keyboard', () => {
    it('closes the calendar with Escape and returns focus to the fields', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          .value=${june}
        ></gui-range-date-picker>`,
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
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          readonly
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-picker>`,
      );

      part('start', 'month').should('have.attr', 'readonly');
      toggle().click();
      day('2026-06-18').click();
      day('2026-06-20').click();

      cy.get('@change').should('not.have.been.called');
      pills().should('have.length', 1).and('be.disabled');
    });

    it('disables its fields and its calendar toggle', () => {
      cy.mount(
        html`<gui-range-date-picker
          label="Stay"
          locale-id="en-US"
          disabled
          .value=${june}
        ></gui-range-date-picker>`,
      );

      part('start', 'month').should('be.disabled');
      toggle().should('be.disabled');
      cy.get('gui-range-date-picker .gui-widget').first().click({ force: true });
      calendar().should('not.exist');
    });
  });
});
